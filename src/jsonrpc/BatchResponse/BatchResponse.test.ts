import { describe, expect, it } from "vitest";
import { BatchResponse, errors, findById, from, results } from "./index.js";

describe("BatchResponse", () => {
	describe("from", () => {
		it("creates batch from array of responses", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, result: "0x456" },
			]);
			expect(batch).toHaveLength(2);
			expect(batch[0].id).toBe(1);
			expect(batch[1].id).toBe(2);
		});

		it("creates batch with mixed success and error responses", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, error: { code: -32601, message: "Method not found" } },
			]);
			expect(batch).toHaveLength(2);
		});

		it("creates empty batch", () => {
			const batch = from([]);
			expect(batch).toHaveLength(0);
			expect(Object.isFrozen(batch)).toBe(true);
		});

		it("freezes the array", () => {
			const batch = from([{ id: 1, result: "test" }]);
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

		it("throws if response is not object", () => {
			expect(() =>
				from([
					// @ts-expect-error - Testing invalid input
					"invalid",
				]),
			).toThrow(TypeError);
		});

		it("throws if response missing both result and error", () => {
			expect(() =>
				from([
					// @ts-expect-error - Testing invalid input
					{ id: 1 },
				]),
			).toThrow(TypeError);
		});

		it("validates all responses in batch", () => {
			expect(() =>
				from([
					{ id: 1, result: "test" },
					// @ts-expect-error - Testing invalid input
					{ id: 2 }, // missing result/error
				]),
			).toThrow(TypeError);
		});
	});

	describe("findById", () => {
		it("finds response by id", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, result: "0x456" },
				{ id: 3, result: "0x789" },
			]);
			const res = findById(batch)(2);
			expect(res).toBeDefined();
			expect(res?.id).toBe(2);
			if (res && "result" in res) {
				expect(res.result).toBe("0x456");
			}
		});

		it("finds error response by id", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, error: { code: -32601, message: "Method not found" } },
			]);
			const res = findById(batch)(2);
			expect(res).toBeDefined();
			if (res && "error" in res) {
				expect(res.error.code).toBe(-32601);
			}
		});

		it("returns undefined for non-existent id", () => {
			const batch = from([{ id: 1, result: "0x123" }]);
			const res = findById(batch)(999);
			expect(res).toBeUndefined();
		});

		it("finds by string id", () => {
			const batch = from([
				{ id: "abc", result: "0x123" },
				{ id: "def", result: "0x456" },
			]);
			const res = findById(batch)("def");
			expect(res?.id).toBe("def");
		});

		it("finds by null id", () => {
			const batch = from([
				{ id: null, result: "0x123" },
				{ id: 1, result: "0x456" },
			]);
			const res = findById(batch)(null);
			expect(res?.id).toBe(null);
		});
	});

	describe("errors", () => {
		it("returns all error responses", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, error: { code: -32601, message: "Method not found" } },
				{ id: 3, result: "0x456" },
				{ id: 4, error: { code: -32602, message: "Invalid params" } },
			]);
			const errs = errors(batch);
			expect(errs).toHaveLength(2);
			expect(errs[0].id).toBe(2);
			expect(errs[1].id).toBe(4);
		});

		it("returns empty array if no errors", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, result: "0x456" },
			]);
			const errs = errors(batch);
			expect(errs).toHaveLength(0);
		});

		it("returns all responses if all errors", () => {
			const batch = from([
				{ id: 1, error: { code: -32601, message: "test1" } },
				{ id: 2, error: { code: -32602, message: "test2" } },
			]);
			const errs = errors(batch);
			expect(errs).toHaveLength(2);
		});

		it("returns empty array for empty batch", () => {
			const batch = from([]);
			const errs = errors(batch);
			expect(errs).toHaveLength(0);
		});
	});

	describe("results", () => {
		it("returns all success responses", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, error: { code: -32601, message: "Method not found" } },
				{ id: 3, result: "0x456" },
				{ id: 4, error: { code: -32602, message: "Invalid params" } },
			]);
			const res = results(batch);
			expect(res).toHaveLength(2);
			expect(res[0].id).toBe(1);
			expect(res[1].id).toBe(3);
		});

		it("returns empty array if no results", () => {
			const batch = from([
				{ id: 1, error: { code: -32601, message: "test1" } },
				{ id: 2, error: { code: -32602, message: "test2" } },
			]);
			const res = results(batch);
			expect(res).toHaveLength(0);
		});

		it("returns all responses if all success", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, result: "0x456" },
			]);
			const res = results(batch);
			expect(res).toHaveLength(2);
		});

		it("returns empty array for empty batch", () => {
			const batch = from([]);
			const res = results(batch);
			expect(res).toHaveLength(0);
		});
	});

	describe("namespace", () => {
		it("BatchResponse.from() works", () => {
			const batch = BatchResponse.from([{ id: 1, result: "test" }]);
			expect(batch).toHaveLength(1);
		});

		it("BatchResponse.findById() works", () => {
			const batch = BatchResponse.from([{ id: 1, result: "test" }]);
			const res = BatchResponse.findById(batch)(1);
			expect(res?.id).toBe(1);
		});

		it("BatchResponse.errors() works", () => {
			const batch = BatchResponse.from([
				{ id: 1, error: { code: -32601, message: "test" } },
			]);
			const errs = BatchResponse.errors(batch);
			expect(errs).toHaveLength(1);
		});

		it("BatchResponse.results() works", () => {
			const batch = BatchResponse.from([{ id: 1, result: "test" }]);
			const res = BatchResponse.results(batch);
			expect(res).toHaveLength(1);
		});
	});

	describe("real-world scenarios", () => {
		it("processes batch of eth queries", () => {
			const batch = from([
				{ id: 1, result: "0x123456" }, // eth_blockNumber
				{ id: 2, result: "0x3b9aca00" }, // eth_gasPrice
				{ id: 3, result: "0x1" }, // eth_chainId
			]);
			expect(results(batch)).toHaveLength(3);
			expect(errors(batch)).toHaveLength(0);
		});

		it("handles partial failures", () => {
			const batch = from([
				{ id: 1, result: "0x123456" },
				{ id: 2, error: { code: -32601, message: "Method not found" } },
				{ id: 3, result: "0x1" },
			]);
			expect(results(batch)).toHaveLength(2);
			expect(errors(batch)).toHaveLength(1);
		});

		it("correlates responses with requests", () => {
			const batch = from([
				{ id: 2, result: "0x456" }, // Out of order
				{ id: 1, result: "0x123" },
				{ id: 3, error: { code: -32601, message: "test" } },
			]);

			const res1 = findById(batch)(1);
			const res2 = findById(batch)(2);
			const res3 = findById(batch)(3);

			expect(res1?.id).toBe(1);
			expect(res2?.id).toBe(2);
			expect(res3?.id).toBe(3);
		});

		it("extracts only successful results", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, error: { code: -32601, message: "test" } },
				{ id: 3, result: "0x456" },
			]);

			const successResults = results(batch);
			expect(successResults).toHaveLength(2);
			expect(successResults.every((r) => "result" in r)).toBe(true);
		});

		it("extracts only errors", () => {
			const batch = from([
				{ id: 1, result: "0x123" },
				{ id: 2, error: { code: -32601, message: "test1" } },
				{ id: 3, error: { code: -32602, message: "test2" } },
			]);

			const errorResults = errors(batch);
			expect(errorResults).toHaveLength(2);
			expect(errorResults.every((r) => "error" in r)).toBe(true);
		});
	});
});
