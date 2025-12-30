/**
 * Tests for docs/primitives/eventlog/getTopic0.mdx
 * Tests the code examples from the EventLog.getTopic0() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog getTopic0.mdx documentation examples", () => {
	describe("Topic0 Semantics", () => {
		it("non-anonymous events: topic0 is event signature hash", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Transfer(address,address,uint256) signature hash
			const transferSig = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [transferSig, Hash.from("0x" + "11".repeat(32))],
				data: new Uint8Array([]),
			});

			const sig = EventLog.getTopic0(log);
			expect(Hash.toHex(sig!)).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
		});

		it("anonymous events: topic0 is first indexed param (NOT signature)", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const fromHash = Hash.from("0x" + "11".repeat(32));
			const toHash = Hash.from("0x" + "22".repeat(32));
			const tokenIdHash = Hash.from("0x" + "33".repeat(32));

			const anonymousLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [
					fromHash, // topic0 = first indexed param (from)
					toHash, // topic1 = second indexed param (to)
					tokenIdHash, // topic2 = third indexed param (tokenId)
				],
				data: new Uint8Array([]),
			});

			const topic0 = EventLog.getTopic0(anonymousLog);
			// Returns fromHash, NOT event signature
			expect(Hash.equals(topic0!, fromHash)).toBe(true);
		});
	});

	describe("Identifying Event Type", () => {
		it("identifies event type by signature", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const APPROVAL_SIG = Hash.from(
				"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			);

			type EventLogType = ReturnType<typeof EventLog.create>;

			function identifyEvent(log: EventLogType): string {
				const sig = EventLog.getTopic0(log);
				if (!sig) return "unknown";

				if (Hash.equals(sig, TRANSFER_SIG)) return "Transfer";
				if (Hash.equals(sig, APPROVAL_SIG)) return "Approval";
				return "unknown";
			}

			const transferLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [TRANSFER_SIG],
				data: new Uint8Array([]),
			});

			const approvalLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [APPROVAL_SIG],
				data: new Uint8Array([]),
			});

			const unknownLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "99".repeat(32))],
				data: new Uint8Array([]),
			});

			expect(identifyEvent(transferLog)).toBe("Transfer");
			expect(identifyEvent(approvalLog)).toBe("Approval");
			expect(identifyEvent(unknownLog)).toBe("unknown");
		});
	});

	describe("Filtering by Signature", () => {
		it("filters all Transfer events", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);

			const allLogs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "99".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG],
					data: new Uint8Array([]),
				}),
			];

			// Find all Transfer events
			// NOTE: Docs show allLogs.filter(log => { const sig = log.getTopic0(); ... })
			// Actual API: allLogs.filter(log => { const sig = EventLog.getTopic0(log); ... })
			const transferLogs = allLogs.filter((log) => {
				const sig = EventLog.getTopic0(log);
				return sig && Hash.equals(sig, TRANSFER_SIG);
			});

			expect(transferLogs.length).toBe(2);
		});
	});

	describe("Validating Event Structure", () => {
		it("validates Transfer log structure", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);

			type EventLogType = ReturnType<typeof EventLog.create>;

			function validateTransferLog(log: EventLogType): boolean {
				const sig = EventLog.getTopic0(log);
				if (!sig) {
					return false;
				}

				if (!Hash.equals(sig, TRANSFER_SIG)) {
					return false;
				}

				// Transfer should have 2 indexed parameters (from, to)
				if (EventLog.getIndexedTopics(log).length !== 2) {
					return false;
				}

				return true;
			}

			const validLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [
					TRANSFER_SIG,
					Hash.from("0x" + "11".repeat(32)),
					Hash.from("0x" + "22".repeat(32)),
				],
				data: new Uint8Array([]),
			});

			const invalidLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [TRANSFER_SIG], // Missing indexed params
				data: new Uint8Array([]),
			});

			expect(validateTransferLog(validLog)).toBe(true);
			expect(validateTransferLog(invalidLog)).toBe(false);
		});
	});

	describe("Empty Topics Array", () => {
		it("getTopic0() returns undefined for empty topics", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");

			const emptyLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [],
				data: new Uint8Array([]),
			});

			const topic0 = EventLog.getTopic0(emptyLog);
			expect(topic0).toBeUndefined();
		});
	});
});
