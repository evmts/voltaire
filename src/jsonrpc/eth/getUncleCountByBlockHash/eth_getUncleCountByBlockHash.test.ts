import { describe, expect, test } from "vitest";
import {
	GetUncleCountByBlockHashRequest,
	method,
} from "./eth_getUncleCountByBlockHash.js";

describe("eth_getUncleCountByBlockHash", () => {
	describe("Request Creation", () => {
		test("creates request with block hash", () => {
			const blockHash =
				"0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleCountByBlockHashRequest(blockHash);
			expect(req).toEqual({
				method: "eth_getUncleCountByBlockHash",
				params: [blockHash],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getUncleCountByBlockHash");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const blockHash =
				"0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleCountByBlockHashRequest(blockHash);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const blockHash =
				"0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleCountByBlockHashRequest(blockHash);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles genesis block hash", () => {
			const blockHash =
				"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3";
			const req = GetUncleCountByBlockHashRequest(blockHash);
			expect(req.params?.[0]).toBe(blockHash);
		});

		test("handles recent block hash", () => {
			const blockHash =
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
			const req = GetUncleCountByBlockHashRequest(blockHash);
			expect(req.params?.[0]).toBe(blockHash);
		});
	});
});
