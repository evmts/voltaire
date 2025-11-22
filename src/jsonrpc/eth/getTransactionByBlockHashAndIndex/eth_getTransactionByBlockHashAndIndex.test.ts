import { describe, test, expect } from "vitest";
import { method, GetTransactionByBlockHashAndIndexRequest } from "./eth_getTransactionByBlockHashAndIndex.js";

describe("eth_getTransactionByBlockHashAndIndex", () => {
	describe("Request Creation", () => {
		test("creates request with block hash and transaction index", () => {
			const blockHash = "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7";
			const txIndex = "0x0";
			const req = GetTransactionByBlockHashAndIndexRequest(blockHash, txIndex);
			expect(req).toEqual({
				method: "eth_getTransactionByBlockHashAndIndex",
				params: [blockHash, txIndex],
			});
		});

		test("creates request with different transaction index", () => {
			const blockHash = "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7";
			const txIndex = "0x2";
			const req = GetTransactionByBlockHashAndIndexRequest(blockHash, txIndex);
			expect(req).toEqual({
				method: "eth_getTransactionByBlockHashAndIndex",
				params: [blockHash, txIndex],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getTransactionByBlockHashAndIndex");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const blockHash = "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7";
			const req = GetTransactionByBlockHashAndIndexRequest(blockHash, "0x0");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const blockHash = "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7";
			const req = GetTransactionByBlockHashAndIndexRequest(blockHash, "0x0");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles first transaction index", () => {
			const blockHash = "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7";
			const req = GetTransactionByBlockHashAndIndexRequest(blockHash, "0x0");
			expect(req.params?.[1]).toBe("0x0");
		});

		test("handles higher transaction index", () => {
			const blockHash = "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7";
			const req = GetTransactionByBlockHashAndIndexRequest(blockHash, "0xff");
			expect(req.params?.[1]).toBe("0xff");
		});
	});
});
