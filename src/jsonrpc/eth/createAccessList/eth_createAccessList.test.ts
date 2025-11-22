import { describe, test, expect } from "vitest";
import { method, CreateAccessListRequest } from "./eth_createAccessList.js";

describe("eth_createAccessList", () => {
	describe("Request Creation", () => {
		test("creates request with params and default block", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CreateAccessListRequest(params);
			expect(req).toEqual({
				method: "eth_createAccessList",
				params: [params, "latest"],
			});
		});

		test("creates request with params and explicit block", () => {
			const params = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				data: "0xa9059cbb",
			};
			const req = CreateAccessListRequest(params, "0x5678");
			expect(req).toEqual({
				method: "eth_createAccessList",
				params: [params, "0x5678"],
			});
		});

		test("creates request with block tag", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x",
			};
			const req = CreateAccessListRequest(params, "pending");
			expect(req).toEqual({
				method: "eth_createAccessList",
				params: [params, "pending"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_createAccessList");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CreateAccessListRequest(params);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CreateAccessListRequest(params);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles simple call", () => {
			const params = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
			};
			const req = CreateAccessListRequest(params);
			expect(req.params?.[0]).toEqual(params);
		});

		test("handles call with data", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
			};
			const req = CreateAccessListRequest(params);
			expect(req.params?.[0]).toHaveProperty("data");
		});

		test("handles earliest block tag", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CreateAccessListRequest(params, "earliest");
			expect(req.params?.[1]).toBe("earliest");
		});

		test("handles finalized block tag", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CreateAccessListRequest(params, "finalized");
			expect(req.params?.[1]).toBe("finalized");
		});

		test("handles call with value", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				value: "0xde0b6b3a7640000",
			};
			const req = CreateAccessListRequest(params);
			expect(req.params?.[0]).toHaveProperty("value");
		});
	});
});
