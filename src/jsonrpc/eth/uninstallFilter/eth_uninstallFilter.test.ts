import { describe, test, expect } from "vitest";
import { method, UninstallFilterRequest } from "./eth_uninstallFilter.js";

describe("eth_uninstallFilter", () => {
	describe("Request Creation", () => {
		test("creates request with filter id", () => {
			const filterId = "0x1";
			const req = UninstallFilterRequest(filterId);
			expect(req).toEqual({
				method: "eth_uninstallFilter",
				params: [filterId],
			});
		});

		test("creates request with different filter id", () => {
			const filterId = "0xabc";
			const req = UninstallFilterRequest(filterId);
			expect(req).toEqual({
				method: "eth_uninstallFilter",
				params: [filterId],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_uninstallFilter");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const filterId = "0x1";
			const req = UninstallFilterRequest(filterId);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const filterId = "0x1";
			const req = UninstallFilterRequest(filterId);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles filter id 0x0", () => {
			const filterId = "0x0";
			const req = UninstallFilterRequest(filterId);
			expect(req.params?.[0]).toBe(filterId);
		});

		test("handles large filter id", () => {
			const filterId = "0xffffffffff";
			const req = UninstallFilterRequest(filterId);
			expect(req.params?.[0]).toBe(filterId);
		});
	});
});
