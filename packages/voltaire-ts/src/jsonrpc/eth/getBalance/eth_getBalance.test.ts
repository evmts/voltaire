import { describe, expect, test } from "vitest";
import { GetBalanceRequest, method } from "./eth_getBalance.js";

describe("eth_getBalance", () => {
	describe("Request Creation", () => {
		test("creates request with address and default block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetBalanceRequest(address);
			expect(req).toEqual({
				method: "eth_getBalance",
				params: [address, "latest"],
			});
		});

		test("creates request with address and explicit block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetBalanceRequest(address, "0x1234");
			expect(req).toEqual({
				method: "eth_getBalance",
				params: [address, "0x1234"],
			});
		});

		test("creates request with earliest block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetBalanceRequest(address, "earliest");
			expect(req).toEqual({
				method: "eth_getBalance",
				params: [address, "earliest"],
			});
		});

		test("creates request with pending block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetBalanceRequest(address, "pending");
			expect(req).toEqual({
				method: "eth_getBalance",
				params: [address, "pending"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getBalance");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetBalanceRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const req = GetBalanceRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles lowercase address", () => {
			const address = "0xabcdef1234567890abcdef1234567890abcdef12";
			const req = GetBalanceRequest(address);
			expect(req.params?.[0]).toBe(address);
		});

		test("handles uppercase address", () => {
			const address = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
			const req = GetBalanceRequest(address);
			expect(req.params?.[0]).toBe(address);
		});

		test("handles finalized block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetBalanceRequest(address, "finalized");
			expect(req.params?.[1]).toBe("finalized");
		});

		test("handles safe block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetBalanceRequest(address, "safe");
			expect(req.params?.[1]).toBe("safe");
		});
	});
});
