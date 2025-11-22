import { describe, test, expect } from "vitest";
import { method, MiningRequest } from "./eth_mining.js";

describe("eth_mining", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = MiningRequest();
			expect(req).toEqual({
				method: "eth_mining",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_mining");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = MiningRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = MiningRequest();
			expect(req.method).toBe(method);
		});
	});
});
