/**
 * Tests for docs/primitives/eventlog/from.mdx
 * Tests the code examples from the EventLog.from() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog from.mdx documentation examples", () => {
	describe("From RPC Response", () => {
		it("transforms eth_getLogs response", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");
			const Hex = await import("../../../src/primitives/Hex/index.js");

			// Simulated RPC response
			const rpcLog = {
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x000000000000000000000000a1b2c3d4e5f67890abcdef1234567890abcdef12",
				],
				data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
				blockNumber: "0x112a880",
				blockHash:
					"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				transactionHash:
					"0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
				transactionIndex: "0xa",
				logIndex: "0x5",
				removed: false,
			};

			const log = EventLog.create({
				address: Address.Address(rpcLog.address),
				topics: rpcLog.topics.map((t) => Hash.from(t)),
				data: Hex.toBytes(rpcLog.data),
				blockNumber: BigInt(rpcLog.blockNumber),
				blockHash: Hash.from(rpcLog.blockHash),
				transactionHash: Hash.from(rpcLog.transactionHash),
				transactionIndex: Number(rpcLog.transactionIndex),
				logIndex: Number(rpcLog.logIndex),
				removed: rpcLog.removed,
			});

			expect(log.blockNumber).toBe(18000000n); // 0x112a880 = 18000000
			expect(log.transactionIndex).toBe(10); // 0xa = 10
			expect(log.logIndex).toBe(5); // 0x5 = 5
			expect(log.removed).toBe(false);
			expect(log.topics.length).toBe(2);
		});
	});

	describe("Minimal Log (Testing)", () => {
		it("creates minimal log with required fields only", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Minimal log with required fields only
			const testLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [
					Hash.from(
						"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					),
				],
				data: new Uint8Array([]),
			});

			expect(testLog.blockNumber).toBeUndefined();
			expect(testLog.removed).toBe(false); // defaults to false
		});
	});

	describe("Complete Log with Metadata", () => {
		it("creates log with all optional fields", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const fromHash = Hash.from("0x" + "11".repeat(32));
			const toHash = Hash.from("0x" + "22".repeat(32));
			const blockHash = Hash.from("0x" + "ab".repeat(32));
			const txHash = Hash.from("0x" + "de".repeat(32));

			const log = EventLog.create({
				address: Address.Address(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
				),
				topics: [TRANSFER_SIG, fromHash, toHash],
				data: new Uint8Array(32), // value placeholder
				blockNumber: 18000000n,
				blockHash: blockHash,
				transactionHash: txHash,
				transactionIndex: 10,
				logIndex: 5,
				removed: false,
			});

			expect(log.blockNumber).toBe(18000000n);
			expect(log.transactionIndex).toBe(10);
			expect(log.logIndex).toBe(5);
			expect(log.removed).toBe(false);
			expect(log.topics.length).toBe(3);
		});
	});

	describe("Anonymous Event", () => {
		it("creates anonymous event with 4 indexed parameters", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const param1Hash = Hash.from("0x" + "11".repeat(32));
			const param2Hash = Hash.from("0x" + "22".repeat(32));
			const param3Hash = Hash.from("0x" + "33".repeat(32));
			const param4Hash = Hash.from("0x" + "44".repeat(32));

			// Anonymous event with 4 indexed parameters (no signature in topic0)
			const anonymousLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [param1Hash, param2Hash, param3Hash, param4Hash],
				data: new Uint8Array([]),
			});

			// getTopic0 returns first indexed parameter (not signature)
			const firstParam = EventLog.getTopic0(anonymousLog);
			expect(Hash.equals(firstParam!, param1Hash)).toBe(true);

			// All 4 topics present
			expect(anonymousLog.topics.length).toBe(4);

			// getIndexedTopics returns topic1-3 (remaining 3 params)
			const indexed = EventLog.getIndexedTopics(anonymousLog);
			expect(indexed.length).toBe(3);
		});
	});

	describe("EventLog() vs from() vs create()", () => {
		it("all constructor variants are equivalent", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const params = {
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([1, 2, 3]),
			};

			// All equivalent according to docs
			// NOTE: The docs show EventLog(params) but the actual API exports from() and create()
			const log1 = EventLog.from(params);
			const log2 = EventLog.create(params);

			// Both should produce equivalent results
			expect(log1.address).toEqual(log2.address);
			expect(log1.topics).toEqual(log2.topics);
			expect(log1.data).toEqual(log2.data);
		});
	});

	describe("Topics Array Constraints", () => {
		it("supports up to 4 topics", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const topic0 = Hash.from("0x" + "00".repeat(32));
			const topic1 = Hash.from("0x" + "11".repeat(32));
			const topic2 = Hash.from("0x" + "22".repeat(32));
			const topic3 = Hash.from("0x" + "33".repeat(32));

			// Non-anonymous: topic0 = signature, topic1-3 = indexed params (max 3)
			const nonAnonymousLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [topic0, topic1, topic2, topic3],
				data: new Uint8Array([]),
			});

			expect(nonAnonymousLog.topics.length).toBe(4);
			expect(EventLog.getIndexedTopics(nonAnonymousLog).length).toBe(3);
		});

		it("supports empty topics array", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [],
				data: new Uint8Array([]),
			});

			expect(log.topics.length).toBe(0);
			expect(EventLog.getTopic0(log)).toBeUndefined();
		});
	});
});
