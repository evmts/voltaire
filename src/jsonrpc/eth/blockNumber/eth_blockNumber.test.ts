import { describe, test, expect } from "vitest";
import { method, BlockNumberRequest } from "./eth_blockNumber.js";

describe("eth_blockNumber", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = BlockNumberRequest();
			expect(req).toEqual({
				method: "eth_blockNumber",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_blockNumber");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = BlockNumberRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = BlockNumberRequest();
			expect(req.method).toBe(method);
		});
	});
});
