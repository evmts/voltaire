import { describe, test, expect } from "vitest";
import { method, CoinbaseRequest } from "./eth_coinbase.js";

describe("eth_coinbase", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = CoinbaseRequest();
			expect(req).toEqual({
				method: "eth_coinbase",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_coinbase");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = CoinbaseRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = CoinbaseRequest();
			expect(req.method).toBe(method);
		});
	});
});
