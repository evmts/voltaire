import { describe, expect, test } from "vitest";
import {
	GetTransactionByHashRequest,
	method,
} from "./eth_getTransactionByHash.js";

describe("eth_getTransactionByHash", () => {
	describe("Request Creation", () => {
		test("creates request with transaction hash", () => {
			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";
			const req = GetTransactionByHashRequest(txHash);
			expect(req).toEqual({
				method: "eth_getTransactionByHash",
				params: [txHash],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getTransactionByHash");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";
			const req = GetTransactionByHashRequest(txHash);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";
			const req = GetTransactionByHashRequest(txHash);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles pending transaction hash", () => {
			const txHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const req = GetTransactionByHashRequest(txHash);
			expect(req.params?.[0]).toBe(txHash);
		});

		test("handles confirmed transaction hash", () => {
			const txHash =
				"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
			const req = GetTransactionByHashRequest(txHash);
			expect(req.params?.[0]).toBe(txHash);
		});
	});
});
