import { describe, test, expect } from "vitest";
import { method, GetFilterChangesRequest } from "./eth_getFilterChanges.js";

describe("eth_getFilterChanges", () => {
	describe("Request Creation", () => {
		test("creates request with filter id", () => {
			const filterId = "0x1";
			const req = GetFilterChangesRequest(filterId);
			expect(req).toEqual({
				method: "eth_getFilterChanges",
				params: [filterId],
			});
		});

		test("creates request with different filter id", () => {
			const filterId = "0xabcd";
			const req = GetFilterChangesRequest(filterId);
			expect(req).toEqual({
				method: "eth_getFilterChanges",
				params: [filterId],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getFilterChanges");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const filterId = "0x1";
			const req = GetFilterChangesRequest(filterId);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const filterId = "0x1";
			const req = GetFilterChangesRequest(filterId);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles filter id 0x0", () => {
			const filterId = "0x0";
			const req = GetFilterChangesRequest(filterId);
			expect(req.params?.[0]).toBe(filterId);
		});

		test("handles large filter id", () => {
			const filterId = "0xffffffffffffffff";
			const req = GetFilterChangesRequest(filterId);
			expect(req.params?.[0]).toBe(filterId);
		});
	});
});
