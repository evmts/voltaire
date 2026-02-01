/**
 * Tests for docs/primitives/eventlog/index.mdx
 * Tests the code examples from the EventLog overview documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog index.mdx documentation examples", () => {
	describe("Type Definition", () => {
		it("EventLogType has correct structure", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Create a log matching the type definition in docs
			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([1, 2, 3]),
				blockNumber: 18000000n,
				transactionHash: Hash.from("0x" + "ab".repeat(32)),
				transactionIndex: 5,
				blockHash: Hash.from("0x" + "cd".repeat(32)),
				logIndex: 10,
				removed: false,
			});

			expect(log.address).toBeDefined();
			expect(log.topics).toBeDefined();
			expect(log.data).toBeDefined();
			expect(log.blockNumber).toBe(18000000n);
			expect(log.transactionIndex).toBe(5);
			expect(log.logIndex).toBe(10);
			expect(log.removed).toBe(false);
		});
	});

	describe("API Methods - Constructors", () => {
		it("EventLog.from() creates log", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const log = EventLog.from({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
			});

			expect(log).toBeDefined();
			expect(log.address).toBeDefined();
		});

		it("EventLog.create() creates log", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
			});

			expect(log).toBeDefined();
		});

		it("EventLog.clone() creates deep copy", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const original = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([1, 2, 3]),
			});

			const cloned = EventLog.clone(original);

			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned.data).not.toBe(original.data);
		});
	});

	describe("API Methods - Accessors", () => {
		it("getTopic0() returns event signature", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const topic0 = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [topic0],
				data: new Uint8Array([]),
			});

			const result = EventLog.getTopic0(log);
			expect(Hash.equals(result!, topic0)).toBe(true);
		});

		it("getSignature() is alias for getTopic0", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const topic0 = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [topic0],
				data: new Uint8Array([]),
			});

			const sig = EventLog.getSignature(log);
			const t0 = EventLog.getTopic0(log);
			expect(Hash.equals(sig!, t0!)).toBe(true);
		});

		it("getIndexedTopics() returns topic1-3", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const topic0 = Hash.from("0x" + "00".repeat(32));
			const topic1 = Hash.from("0x" + "11".repeat(32));
			const topic2 = Hash.from("0x" + "22".repeat(32));

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [topic0, topic1, topic2],
				data: new Uint8Array([]),
			});

			const indexed = EventLog.getIndexedTopics(log);
			expect(indexed.length).toBe(2);
			expect(Hash.equals(indexed[0]!, topic1)).toBe(true);
			expect(Hash.equals(indexed[1]!, topic2)).toBe(true);
		});

		it("getIndexed() is alias for getIndexedTopics", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [
					Hash.from("0x" + "00".repeat(32)),
					Hash.from("0x" + "11".repeat(32)),
				],
				data: new Uint8Array([]),
			});

			const indexed = EventLog.getIndexed(log);
			const indexedTopics = EventLog.getIndexedTopics(log);
			expect(indexed.length).toBe(indexedTopics.length);
		});
	});

	describe("API Methods - Filtering", () => {
		it("matchesAddress() checks contract address", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const addr1 = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const addr2 = Address.Address(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);

			const log = EventLog.create({
				address: addr1,
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
			});

			expect(EventLog.matchesAddress(log, addr1)).toBe(true);
			expect(EventLog.matchesAddress(log, addr2)).toBe(false);
			// Array filter (OR logic)
			expect(EventLog.matchesAddress(log, [addr1, addr2])).toBe(true);
		});

		it("matchesTopics() with null wildcards", async () => {
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

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [TRANSFER_SIG, fromHash, toHash],
				data: new Uint8Array([]),
			});

			// Exact match
			expect(EventLog.matchesTopics(log, [TRANSFER_SIG, fromHash, toHash])).toBe(
				true,
			);
			// Wildcard (null matches any)
			expect(EventLog.matchesTopics(log, [TRANSFER_SIG, null, toHash])).toBe(
				true,
			);
			// Empty filter matches all
			expect(EventLog.matchesTopics(log, [])).toBe(true);
		});

		it("matchesFilter() with complete criteria", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const addr = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const topic0 = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);

			const log = EventLog.create({
				address: addr,
				topics: [topic0],
				data: new Uint8Array([]),
				blockNumber: 18000000n,
			});

			expect(
				EventLog.matchesFilter(log, {
					address: addr,
					topics: [topic0],
					fromBlock: 17000000n,
					toBlock: 19000000n,
				}),
			).toBe(true);

			expect(
				EventLog.matchesFilter(log, {
					fromBlock: 19000000n, // out of range
				}),
			).toBe(false);
		});

		it("filterLogs() filters array of logs", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const addr1 = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const addr2 = Address.Address(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);

			const logs = [
				EventLog.create({
					address: addr1,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([1]),
				}),
				EventLog.create({
					address: addr2,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([2]),
				}),
				EventLog.create({
					address: addr1,
					topics: [Hash.from("0x" + "11".repeat(32))],
					data: new Uint8Array([3]),
				}),
			];

			const filtered = EventLog.filterLogs(logs, { address: addr1 });
			expect(filtered.length).toBe(2);
		});
	});

	describe("API Methods - Utilities", () => {
		it("isRemoved() checks reorg status", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const activeLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
				removed: false,
			});

			const removedLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
				removed: true,
			});

			expect(EventLog.isRemoved(activeLog)).toBe(false);
			expect(EventLog.isRemoved(removedLog)).toBe(true);
		});

		it("wasRemoved() is alias for isRemoved", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
				removed: true,
			});

			expect(EventLog.wasRemoved(log)).toBe(EventLog.isRemoved(log));
		});

		it("sortLogs() sorts chronologically", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const logs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
					blockNumber: 300n,
					logIndex: 0,
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
					blockNumber: 100n,
					logIndex: 5,
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
					blockNumber: 100n,
					logIndex: 2,
				}),
			];

			const sorted = EventLog.sortLogs(logs);
			expect(sorted[0]?.blockNumber).toBe(100n);
			expect(sorted[0]?.logIndex).toBe(2);
			expect(sorted[1]?.blockNumber).toBe(100n);
			expect(sorted[1]?.logIndex).toBe(5);
			expect(sorted[2]?.blockNumber).toBe(300n);
		});
	});

	describe("Usage Patterns from docs", () => {
		// NOTE: The docs show instance method syntax like log.getTopic0() and log.matchesAddress()
		// but the actual API uses static functions: EventLog.getTopic0(log), EventLog.matchesAddress(log, addr)
		// This is an API discrepancy in the documentation

		it("ERC-20 Transfer Event Filtering pattern", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Transfer(address indexed from, address indexed to, uint256 value)
			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const usdcAddress = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const userAddressHash = Hash.from(
				"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
			);

			const allLogs = [
				EventLog.create({
					address: usdcAddress,
					topics: [
						TRANSFER_SIG,
						Hash.from("0x" + "11".repeat(32)),
						userAddressHash,
					],
					data: new Uint8Array(32),
					blockNumber: 18000000n,
					logIndex: 0,
				}),
				EventLog.create({
					address: usdcAddress,
					topics: [
						TRANSFER_SIG,
						Hash.from("0x" + "22".repeat(32)),
						Hash.from("0x" + "33".repeat(32)),
					],
					data: new Uint8Array(32),
					blockNumber: 18000001n,
					logIndex: 0,
				}),
			];

			// Filter transfers to specific user
			const transfersToUser = EventLog.filterLogs(allLogs, {
				address: usdcAddress,
				topics: [
					TRANSFER_SIG, // Event signature
					null, // from: any address
					userAddressHash, // to: user
				],
				fromBlock: 18000000n,
				toBlock: 18500000n,
			});

			expect(transfersToUser.length).toBe(1);

			// Sort chronologically
			const sorted = EventLog.sortLogs(transfersToUser);
			expect(sorted.length).toBe(1);
		});

		it("Chain Reorganization Handling pattern", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const allLogs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
					removed: false,
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
					removed: true,
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
					removed: false,
				}),
			];

			// Filter active (non-removed) logs
			// NOTE: Docs show allLogs.filter(log => !log.isRemoved())
			// Actual API uses: allLogs.filter(log => !EventLog.isRemoved(log))
			const activeLogs = allLogs.filter((log) => !EventLog.isRemoved(log));
			expect(activeLogs.length).toBe(2);

			// Detect reorg events
			// NOTE: Docs show allLogs.filter(log => log.wasRemoved())
			// Actual API uses: allLogs.filter(log => EventLog.wasRemoved(log))
			const removedLogs = allLogs.filter((log) => EventLog.wasRemoved(log));
			expect(removedLogs.length).toBe(1);
		});
	});
});
