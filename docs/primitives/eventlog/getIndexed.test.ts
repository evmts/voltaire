/**
 * Tests for docs/primitives/eventlog/getIndexed.mdx
 * Tests the code examples from the EventLog.getIndexed() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog getIndexed.mdx documentation examples", () => {
	describe("getIndexed() is alias for getIndexedTopics()", () => {
		it("both methods return the same result", async () => {
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
					Hash.from("0x" + "22".repeat(32)),
				],
				data: new Uint8Array([]),
			});

			// Both equivalent
			// NOTE: Docs show log.getIndexedTopics() and log.getIndexed()
			// Actual API: EventLog.getIndexedTopics(log) and EventLog.getIndexed(log)
			const indexed1 = EventLog.getIndexedTopics(log);
			const indexed2 = EventLog.getIndexed(log);

			expect(indexed1.length).toBe(indexed2.length);
			expect(indexed1.length).toBe(2); // topic1 and topic2
		});
	});

	describe("Usage context", () => {
		it("getIndexed is shorter, getIndexedTopics is more explicit", async () => {
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

			// Use whichever name is clearer in context
			const indexed = EventLog.getIndexed(log);
			expect(indexed.length).toBe(2);
			expect(Hash.equals(indexed[0]!, fromHash)).toBe(true);
			expect(Hash.equals(indexed[1]!, toHash)).toBe(true);
		});
	});
});
