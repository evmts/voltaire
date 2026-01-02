import { describe, expect, it } from "vitest";
import { add, BatchRequest, from, size } from "./index.js";

describe("BatchRequest", () => {
	describe("from", () => {
		it("creates batch from array of requests", () => {
			const batch = from([
				{ id: 1, method: "eth_blockNumber" },
				{ id: 2, method: "eth_gasPrice" },
			]);
			expect(batch).toHaveLength(2);
			expect(batch[0].method).toBe("eth_blockNumber");
			expect(batch[1].method).toBe("eth_gasPrice");
		});

		it("creates batch with single request", () => {
			const batch = from([{ id: 1, method: "eth_chainId" }]);
			expect(batch).toHaveLength(1);
		});

		it("freezes the array", () => {
			const batch = from([{ id: 1, method: "test" }]);
			expect(Object.isFrozen(batch)).toBe(true);
		});

		it("throws on non-array", () => {
			// @ts-expect-error - Testing invalid input
			expect(() => from("invalid")).toThrow(TypeError);
			// @ts-expect-error - Testing invalid input
			expect(() => from(null)).toThrow(TypeError);
			// @ts-expect-error - Testing invalid input
			expect(() => from({})).toThrow(TypeError);
		});

		it("throws on empty array", () => {
			expect(() => from([])).toThrow(TypeError);
		});

		it("throws if request missing method", () => {
			expect(() =>
				from([
					// @ts-expect-error - Testing invalid input
					{ id: 1 },
				]),
			).toThrow(TypeError);
		});

		it("throws if request is not object", () => {
			expect(() =>
				from([
					// @ts-expect-error - Testing invalid input
					"invalid",
				]),
			).toThrow(TypeError);
		});

		it("validates all requests in batch", () => {
			expect(() =>
				from([
					{ id: 1, method: "test" },
					// @ts-expect-error - Testing invalid input
					{ id: 2 }, // missing method
				]),
			).toThrow(TypeError);
		});
	});

	describe("add", () => {
		it("adds request to batch", () => {
			const batch1 = from([{ id: 1, method: "eth_blockNumber" }]);
			const batch2 = add(batch1)({ id: 2, method: "eth_gasPrice" });
			expect(batch2).toHaveLength(2);
			expect(batch2[1].method).toBe("eth_gasPrice");
		});

		it("returns new frozen array", () => {
			const batch1 = from([{ id: 1, method: "test" }]);
			const batch2 = add(batch1)({ id: 2, method: "test2" });
			expect(batch1).toHaveLength(1);
			expect(batch2).toHaveLength(2);
			expect(Object.isFrozen(batch2)).toBe(true);
		});

		it("throws on invalid request", () => {
			const batch = from([{ id: 1, method: "test" }]);
			// @ts-expect-error - Testing invalid input
			expect(() => add(batch)(null)).toThrow(TypeError);
			// @ts-expect-error - Testing invalid input
			expect(() => add(batch)("invalid")).toThrow(TypeError);
		});

		it("throws if request missing method", () => {
			const batch = from([{ id: 1, method: "test" }]);
			// @ts-expect-error - Testing invalid input
			expect(() => add(batch)({ id: 2 })).toThrow(TypeError);
		});

		it("can chain multiple adds", () => {
			let batch = from([{ id: 1, method: "test1" }]);
			batch = add(batch)({ id: 2, method: "test2" });
			batch = add(batch)({ id: 3, method: "test3" });
			expect(batch).toHaveLength(3);
		});
	});

	describe("size", () => {
		it("returns batch size", () => {
			const batch = from([
				{ id: 1, method: "test1" },
				{ id: 2, method: "test2" },
				{ id: 3, method: "test3" },
			]);
			expect(size(batch)).toBe(3);
		});

		it("returns 1 for single request", () => {
			const batch = from([{ id: 1, method: "test" }]);
			expect(size(batch)).toBe(1);
		});
	});

	describe("namespace", () => {
		it("BatchRequest.from() works", () => {
			const batch = BatchRequest.from([{ id: 1, method: "test" }]);
			expect(batch).toHaveLength(1);
		});

		it("BatchRequest.add() works", () => {
			const batch1 = BatchRequest.from([{ id: 1, method: "test1" }]);
			const batch2 = BatchRequest.add(batch1)({ id: 2, method: "test2" });
			expect(batch2).toHaveLength(2);
		});

		it("BatchRequest.size() works", () => {
			const batch = BatchRequest.from([
				{ id: 1, method: "test1" },
				{ id: 2, method: "test2" },
			]);
			expect(BatchRequest.size(batch)).toBe(2);
		});
	});

	describe("real-world scenarios", () => {
		it("creates batch for multiple eth queries", () => {
			const batch = from([
				{ id: 1, method: "eth_blockNumber" },
				{ id: 2, method: "eth_gasPrice" },
				{ id: 3, method: "eth_chainId" },
			]);
			expect(size(batch)).toBe(3);
		});

		it("builds batch incrementally", () => {
			let batch = from([{ id: 1, method: "eth_blockNumber", params: [] }]);
			batch = add(batch)({
				id: 2,
				method: "eth_getBalance",
				params: ["0x123...", "latest"],
			});
			batch = add(batch)({
				id: 3,
				method: "eth_getTransactionCount",
				params: ["0x123...", "latest"],
			});
			expect(size(batch)).toBe(3);
		});

		it("preserves request structure", () => {
			const batch = from([
				{
					id: 1,
					method: "eth_call",
					params: [
						{
							to: "0x123...",
							data: "0xabc...",
						},
						"latest",
					],
				},
			]);
			expect(batch[0].params).toBeDefined();
			expect(Array.isArray(batch[0].params)).toBe(true);
		});
	});
});
