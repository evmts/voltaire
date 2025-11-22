import { describe, test, expect } from "vitest";
import {
	method,
	GetBlockTransactionCountByHashRequest,
} from "./eth_getBlockTransactionCountByHash.js";

describe("eth_getBlockTransactionCountByHash", () => {
	describe("Request Creation", () => {
		test("creates request with block hash", () => {
			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const req = GetBlockTransactionCountByHashRequest(blockHash);
			expect(req).toEqual({
				method: "eth_getBlockTransactionCountByHash",
				params: [blockHash],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getBlockTransactionCountByHash");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const req = GetBlockTransactionCountByHashRequest(blockHash);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const req = GetBlockTransactionCountByHashRequest(blockHash);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles block with no transactions", () => {
			const blockHash =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const req = GetBlockTransactionCountByHashRequest(blockHash);
			expect(req.params?.[0]).toBe(blockHash);
		});

		test("handles block with many transactions", () => {
			const blockHash =
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
			const req = GetBlockTransactionCountByHashRequest(blockHash);
			expect(req.params?.[0]).toBe(blockHash);
		});
	});
});
