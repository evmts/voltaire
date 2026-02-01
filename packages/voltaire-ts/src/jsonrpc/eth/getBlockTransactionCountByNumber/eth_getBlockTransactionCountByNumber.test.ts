import { describe, expect, test } from "vitest";
import {
	GetBlockTransactionCountByNumberRequest,
	method,
} from "./eth_getBlockTransactionCountByNumber.js";

describe("eth_getBlockTransactionCountByNumber", () => {
	describe("Request Creation", () => {
		test("creates request with block number", () => {
			const blockNumber = "0x1234";
			const req = GetBlockTransactionCountByNumberRequest(blockNumber);
			expect(req).toEqual({
				method: "eth_getBlockTransactionCountByNumber",
				params: [blockNumber],
			});
		});

		test("creates request with latest block tag", () => {
			const req = GetBlockTransactionCountByNumberRequest("latest");
			expect(req).toEqual({
				method: "eth_getBlockTransactionCountByNumber",
				params: ["latest"],
			});
		});

		test("creates request with earliest block tag", () => {
			const req = GetBlockTransactionCountByNumberRequest("earliest");
			expect(req).toEqual({
				method: "eth_getBlockTransactionCountByNumber",
				params: ["earliest"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getBlockTransactionCountByNumber");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetBlockTransactionCountByNumberRequest("0x1234");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const req = GetBlockTransactionCountByNumberRequest("0x1234");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles pending block tag", () => {
			const req = GetBlockTransactionCountByNumberRequest("pending");
			expect(req.params?.[0]).toBe("pending");
		});

		test("handles finalized block tag", () => {
			const req = GetBlockTransactionCountByNumberRequest("finalized");
			expect(req.params?.[0]).toBe("finalized");
		});

		test("handles safe block tag", () => {
			const req = GetBlockTransactionCountByNumberRequest("safe");
			expect(req.params?.[0]).toBe("safe");
		});

		test("handles block number 0", () => {
			const req = GetBlockTransactionCountByNumberRequest("0x0");
			expect(req.params?.[0]).toBe("0x0");
		});
	});
});
