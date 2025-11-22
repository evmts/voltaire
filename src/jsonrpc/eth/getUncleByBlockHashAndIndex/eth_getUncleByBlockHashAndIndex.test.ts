import { describe, test, expect } from "vitest";
import { method, GetUncleByBlockHashAndIndexRequest } from "./eth_getUncleByBlockHashAndIndex.js";

describe("eth_getUncleByBlockHashAndIndex", () => {
	describe("Request Creation", () => {
		test("creates request with block hash and uncle index", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const uncleIndex = "0x0";
			const req = GetUncleByBlockHashAndIndexRequest(blockHash, uncleIndex);
			expect(req).toEqual({
				method: "eth_getUncleByBlockHashAndIndex",
				params: [blockHash, uncleIndex],
			});
		});

		test("creates request with different uncle index", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const uncleIndex = "0x1";
			const req = GetUncleByBlockHashAndIndexRequest(blockHash, uncleIndex);
			expect(req).toEqual({
				method: "eth_getUncleByBlockHashAndIndex",
				params: [blockHash, uncleIndex],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getUncleByBlockHashAndIndex");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleByBlockHashAndIndexRequest(blockHash, "0x0");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleByBlockHashAndIndexRequest(blockHash, "0x0");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles uncle index 0", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleByBlockHashAndIndexRequest(blockHash, "0x0");
			expect(req.params?.[1]).toBe("0x0");
		});

		test("handles higher uncle index", () => {
			const blockHash = "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c";
			const req = GetUncleByBlockHashAndIndexRequest(blockHash, "0xa");
			expect(req.params?.[1]).toBe("0xa");
		});
	});
});
