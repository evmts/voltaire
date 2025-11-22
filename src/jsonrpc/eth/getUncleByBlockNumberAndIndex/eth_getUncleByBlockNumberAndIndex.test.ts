import { describe, test, expect } from "vitest";
import {
	method,
	GetUncleByBlockNumberAndIndexRequest,
} from "./eth_getUncleByBlockNumberAndIndex.js";

describe("eth_getUncleByBlockNumberAndIndex", () => {
	describe("Request Creation", () => {
		test("creates request with block number and uncle index", () => {
			const blockNumber = "0x1234";
			const uncleIndex = "0x0";
			const req = GetUncleByBlockNumberAndIndexRequest(blockNumber, uncleIndex);
			expect(req).toEqual({
				method: "eth_getUncleByBlockNumberAndIndex",
				params: [blockNumber, uncleIndex],
			});
		});

		test("creates request with block tag and uncle index", () => {
			const uncleIndex = "0x1";
			const req = GetUncleByBlockNumberAndIndexRequest("latest", uncleIndex);
			expect(req).toEqual({
				method: "eth_getUncleByBlockNumberAndIndex",
				params: ["latest", uncleIndex],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getUncleByBlockNumberAndIndex");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetUncleByBlockNumberAndIndexRequest("0x1234", "0x0");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const req = GetUncleByBlockNumberAndIndexRequest("0x1234", "0x0");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles earliest block tag", () => {
			const req = GetUncleByBlockNumberAndIndexRequest("earliest", "0x0");
			expect(req.params?.[0]).toBe("earliest");
		});

		test("handles pending block tag", () => {
			const req = GetUncleByBlockNumberAndIndexRequest("pending", "0x0");
			expect(req.params?.[0]).toBe("pending");
		});

		test("handles uncle index 0", () => {
			const req = GetUncleByBlockNumberAndIndexRequest("0x1234", "0x0");
			expect(req.params?.[1]).toBe("0x0");
		});

		test("handles higher uncle index", () => {
			const req = GetUncleByBlockNumberAndIndexRequest("0x1234", "0x5");
			expect(req.params?.[1]).toBe("0x5");
		});
	});
});
