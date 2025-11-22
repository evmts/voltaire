import { describe, test, expect } from "vitest";
import { method, MaxPriorityFeePerGasRequest } from "./eth_maxPriorityFeePerGas.js";

describe("eth_maxPriorityFeePerGas", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = MaxPriorityFeePerGasRequest();
			expect(req).toEqual({
				method: "eth_maxPriorityFeePerGas",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_maxPriorityFeePerGas");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = MaxPriorityFeePerGasRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = MaxPriorityFeePerGasRequest();
			expect(req.method).toBe(method);
		});
	});
});
