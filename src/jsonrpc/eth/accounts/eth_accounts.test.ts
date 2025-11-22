import { describe, test, expect } from "vitest";
import { method, AccountsRequest } from "./eth_accounts.js";

describe("eth_accounts", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = AccountsRequest();
			expect(req).toEqual({
				method: "eth_accounts",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_accounts");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = AccountsRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = AccountsRequest();
			expect(req.method).toBe(method);
		});
	});
});
