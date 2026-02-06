import { describe, expect, test } from "vitest";
import { HashrateRequest, method } from "./eth_hashrate.js";

describe("eth_hashrate", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = HashrateRequest();
			expect(req).toEqual({
				method: "eth_hashrate",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_hashrate");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = HashrateRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = HashrateRequest();
			expect(req.method).toBe(method);
		});
	});
});
