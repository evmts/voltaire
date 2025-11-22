import { describe, test, expect } from "vitest";
import { method, GetBlockByHashRequest } from "./eth_getBlockByHash.js";

describe("eth_getBlockByHash", () => {
	describe("Request Creation", () => {
		test("creates request with block hash and default fullTransactions", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash);
			expect(req).toEqual({
				method: "eth_getBlockByHash",
				params: [blockHash, false],
			});
		});

		test("creates request with block hash and fullTransactions true", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash, true);
			expect(req).toEqual({
				method: "eth_getBlockByHash",
				params: [blockHash, true],
			});
		});

		test("creates request with block hash and fullTransactions false", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash, false);
			expect(req).toEqual({
				method: "eth_getBlockByHash",
				params: [blockHash, false],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getBlockByHash");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles genesis block hash", () => {
			const blockHash = "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3";
			const req = GetBlockByHashRequest(blockHash);
			expect(req.params?.[0]).toBe(blockHash);
		});

		test("handles requesting transaction hashes only", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash, false);
			expect(req.params?.[1]).toBe(false);
		});

		test("handles requesting full transaction objects", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetBlockByHashRequest(blockHash, true);
			expect(req.params?.[1]).toBe(true);
		});
	});
});
