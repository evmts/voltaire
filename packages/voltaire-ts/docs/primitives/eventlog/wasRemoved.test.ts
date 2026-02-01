/**
 * Tests for docs/primitives/eventlog/wasRemoved.mdx
 * Tests the code examples from the EventLog.wasRemoved() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog wasRemoved.mdx documentation examples", () => {
	describe("wasRemoved() is alias for isRemoved()", () => {
		it("both methods return the same result", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const removedLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
				removed: true,
			});

			const activeLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "11".repeat(32))],
				data: new Uint8Array([]),
				removed: false,
			});

			// Both equivalent
			// NOTE: Docs show log.isRemoved() and log.wasRemoved()
			// Actual API: EventLog.isRemoved(log) and EventLog.wasRemoved(log)
			const removed1 = EventLog.isRemoved(removedLog);
			const removed2 = EventLog.wasRemoved(removedLog);

			expect(removed1).toBe(removed2);
			expect(removed1).toBe(true);

			const active1 = EventLog.isRemoved(activeLog);
			const active2 = EventLog.wasRemoved(activeLog);

			expect(active1).toBe(active2);
			expect(active1).toBe(false);
		});
	});

	describe("Usage context", () => {
		it("wasRemoved() emphasizes past tense, isRemoved() emphasizes current state", async () => {
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

			// Use whichever name is clearer in context

			// wasRemoved() emphasizes past tense (log was removed by reorg)
			expect(EventLog.wasRemoved(log)).toBe(true);

			// isRemoved() emphasizes current state (log is currently marked as removed)
			expect(EventLog.isRemoved(log)).toBe(true);
		});
	});
});
