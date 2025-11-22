import { describe, test, expect } from "vitest";
import { method, GetWorkRequest } from "./eth_getWork.js";

describe("eth_getWork", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = GetWorkRequest();
			expect(req).toEqual({
				method: "eth_getWork",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getWork");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = GetWorkRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = GetWorkRequest();
			expect(req.method).toBe(method);
		});
	});
});
