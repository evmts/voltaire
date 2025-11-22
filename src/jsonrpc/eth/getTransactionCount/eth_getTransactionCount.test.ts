import { describe, test, expect } from "vitest";
import {
	method,
	GetTransactionCountRequest,
} from "./eth_getTransactionCount.js";

describe("eth_getTransactionCount", () => {
	describe("Request Creation", () => {
		test("creates request with address and default block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetTransactionCountRequest(address);
			expect(req).toEqual({
				method: "eth_getTransactionCount",
				params: [address, "latest"],
			});
		});

		test("creates request with address and explicit block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetTransactionCountRequest(address, "0xabcd");
			expect(req).toEqual({
				method: "eth_getTransactionCount",
				params: [address, "0xabcd"],
			});
		});

		test("creates request with pending block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetTransactionCountRequest(address, "pending");
			expect(req).toEqual({
				method: "eth_getTransactionCount",
				params: [address, "pending"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getTransactionCount");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetTransactionCountRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const req = GetTransactionCountRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles nonce query for specific block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetTransactionCountRequest(address, "0x1000");
			expect(req.params?.[1]).toBe("0x1000");
		});

		test("handles earliest block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetTransactionCountRequest(address, "earliest");
			expect(req.params?.[1]).toBe("earliest");
		});

		test("handles finalized block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetTransactionCountRequest(address, "finalized");
			expect(req.params?.[1]).toBe("finalized");
		});
	});
});
