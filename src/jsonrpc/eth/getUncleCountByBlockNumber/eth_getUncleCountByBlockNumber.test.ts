import { describe, test, expect } from "vitest";
import {
	method,
	GetUncleCountByBlockNumberRequest,
} from "./eth_getUncleCountByBlockNumber.js";

describe("eth_getUncleCountByBlockNumber", () => {
	describe("Request Creation", () => {
		test("creates request with block number", () => {
			const blockNumber = "0x1234";
			const req = GetUncleCountByBlockNumberRequest(blockNumber);
			expect(req).toEqual({
				method: "eth_getUncleCountByBlockNumber",
				params: [blockNumber],
			});
		});

		test("creates request with latest tag", () => {
			const req = GetUncleCountByBlockNumberRequest("latest");
			expect(req).toEqual({
				method: "eth_getUncleCountByBlockNumber",
				params: ["latest"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getUncleCountByBlockNumber");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetUncleCountByBlockNumberRequest("0x1234");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const req = GetUncleCountByBlockNumberRequest("0x1234");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles earliest tag", () => {
			const req = GetUncleCountByBlockNumberRequest("earliest");
			expect(req.params?.[0]).toBe("earliest");
		});

		test("handles pending tag", () => {
			const req = GetUncleCountByBlockNumberRequest("pending");
			expect(req.params?.[0]).toBe("pending");
		});

		test("handles finalized tag", () => {
			const req = GetUncleCountByBlockNumberRequest("finalized");
			expect(req.params?.[0]).toBe("finalized");
		});

		test("handles genesis block", () => {
			const req = GetUncleCountByBlockNumberRequest("0x0");
			expect(req.params?.[0]).toBe("0x0");
		});
	});
});
