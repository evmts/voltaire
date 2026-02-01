/**
 * Tests for docs/primitives/eventlog/create.mdx
 * Tests the code examples from the EventLog.create() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog create.mdx documentation examples", () => {
	describe("create() is alias for from()", () => {
		it("EventLog.create() and EventLog.from() are equivalent", async () => {
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
			// const log1 = EventLog(params);     // Primary (recommended) - not exported as callable
			const log2 = EventLog.from(params); // Alias
			const log3 = EventLog.create(params); // Alias

			// Both should produce equivalent results
			expect(log2.address).toEqual(log3.address);
			expect(log2.topics).toEqual(log3.topics);
			expect(log2.data).toEqual(log3.data);
			expect(log2.removed).toEqual(log3.removed);
		});
	});

	describe("Usage with explicit construction", () => {
		it("create() works for explicit construction intent", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Use create() when explicit construction intent improves readability
			const log = EventLog.create({
				address: Address.Address(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
				),
				topics: [
					Hash.from(
						"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					),
				],
				data: new Uint8Array([]),
				blockNumber: 18000000n,
				logIndex: 5,
			});

			expect(log.blockNumber).toBe(18000000n);
			expect(log.logIndex).toBe(5);
			expect(log.topics.length).toBe(1);
		});
	});
});
