import { describe, expect, test } from "vitest";
import { CallRequest, method } from "./eth_call.js";

describe("eth_call", () => {
	describe("Request Creation", () => {
		test("creates request with minimal params and default block", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params);
			expect(req).toEqual({
				method: "eth_call",
				params: [params, "latest"],
			});
		});

		test("creates request with full params and explicit block", () => {
			const params = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				gas: "0x5208",
				gasPrice: "0x3b9aca00",
				value: "0x0",
				data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
			};
			const req = CallRequest(params, "0x1234");
			expect(req).toEqual({
				method: "eth_call",
				params: [params, "0x1234"],
			});
		});

		test("creates request with block tag", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x",
			};
			const req = CallRequest(params, "pending");
			expect(req).toEqual({
				method: "eth_call",
				params: [params, "pending"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_call");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles call with only to address", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params);
			expect(req.params?.[0]).toEqual(params);
		});

		test("handles call with data but no value", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0xa9059cbb",
			};
			const req = CallRequest(params);
			expect(req.params?.[0]).toHaveProperty("data");
			expect(req.params?.[0]).not.toHaveProperty("value");
		});

		test("handles call with from address", () => {
			const params = {
				from: "0x0000000000000000000000000000000000000000",
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params);
			expect(req.params?.[0]).toHaveProperty("from");
		});

		test("handles earliest block tag", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params, "earliest");
			expect(req.params?.[1]).toBe("earliest");
		});

		test("handles finalized block tag", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = CallRequest(params, "finalized");
			expect(req.params?.[1]).toBe("finalized");
		});
	});
});
