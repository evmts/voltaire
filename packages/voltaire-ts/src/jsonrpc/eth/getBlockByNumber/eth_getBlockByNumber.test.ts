import { describe, expect, test } from "vitest";
import { GetBlockByNumberRequest, method } from "./eth_getBlockByNumber.js";

describe("eth_getBlockByNumber", () => {
	describe("Request Creation", () => {
		test("creates request with block number and default fullTransactions", () => {
			const blockNumber = "0x68b3";
			const req = GetBlockByNumberRequest(blockNumber);
			expect(req).toEqual({
				method: "eth_getBlockByNumber",
				params: [blockNumber, false],
			});
		});

		test("creates request with latest tag and fullTransactions true", () => {
			const req = GetBlockByNumberRequest("latest", true);
			expect(req).toEqual({
				method: "eth_getBlockByNumber",
				params: ["latest", true],
			});
		});

		test("creates request with earliest tag", () => {
			const req = GetBlockByNumberRequest("earliest", false);
			expect(req).toEqual({
				method: "eth_getBlockByNumber",
				params: ["earliest", false],
			});
		});

		test("creates request with pending tag", () => {
			const req = GetBlockByNumberRequest("pending");
			expect(req).toEqual({
				method: "eth_getBlockByNumber",
				params: ["pending", false],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getBlockByNumber");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetBlockByNumberRequest("0x1234");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const req = GetBlockByNumberRequest("0x1234");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles genesis block", () => {
			const req = GetBlockByNumberRequest("0x0");
			expect(req.params?.[0]).toBe("0x0");
		});

		test("handles finalized tag", () => {
			const req = GetBlockByNumberRequest("finalized");
			expect(req.params?.[0]).toBe("finalized");
		});

		test("handles safe tag", () => {
			const req = GetBlockByNumberRequest("safe");
			expect(req.params?.[0]).toBe("safe");
		});

		test("handles high block number", () => {
			const req = GetBlockByNumberRequest("0xffffff");
			expect(req.params?.[0]).toBe("0xffffff");
		});

		test("handles fullTransactions true", () => {
			const req = GetBlockByNumberRequest("latest", true);
			expect(req.params?.[1]).toBe(true);
		});

		test("handles fullTransactions false", () => {
			const req = GetBlockByNumberRequest("latest", false);
			expect(req.params?.[1]).toBe(false);
		});
	});
});
