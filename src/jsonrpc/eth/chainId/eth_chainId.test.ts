import { describe, expect, test } from "vitest";
import { ChainIdRequest, method } from "./eth_chainId.js";

describe("eth_chainId", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = ChainIdRequest();
			expect(req).toEqual({
				method: "eth_chainId",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_chainId");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = ChainIdRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = ChainIdRequest();
			expect(req.method).toBe(method);
		});
	});
});
