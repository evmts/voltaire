import { describe, test, expect } from "vitest";
import { method, GasPriceRequest } from "./eth_gasPrice.js";

describe("eth_gasPrice", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = GasPriceRequest();
			expect(req).toEqual({
				method: "eth_gasPrice",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_gasPrice");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = GasPriceRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = GasPriceRequest();
			expect(req.method).toBe(method);
		});
	});
});
