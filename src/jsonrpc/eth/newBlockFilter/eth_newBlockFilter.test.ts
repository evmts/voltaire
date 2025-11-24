import { describe, expect, test } from "vitest";
import { NewBlockFilterRequest, method } from "./eth_newBlockFilter.js";

describe("eth_newBlockFilter", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = NewBlockFilterRequest();
			expect(req).toEqual({
				method: "eth_newBlockFilter",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_newBlockFilter");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = NewBlockFilterRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = NewBlockFilterRequest();
			expect(req.method).toBe(method);
		});
	});
});
