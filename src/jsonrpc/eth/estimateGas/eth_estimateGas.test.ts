import { describe, test, expect } from "vitest";
import { method, EstimateGasRequest } from "./eth_estimateGas.js";

describe("eth_estimateGas", () => {
	describe("Request Creation", () => {
		test("creates request with minimal params", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = EstimateGasRequest(params);
			expect(req).toEqual({
				method: "eth_estimateGas",
				params: [params],
			});
		});

		test("creates request with full params", () => {
			const params = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				gas: "0x5208",
				gasPrice: "0x3b9aca00",
				value: "0xde0b6b3a7640000",
				data: "0xa9059cbb",
			};
			const req = EstimateGasRequest(params);
			expect(req).toEqual({
				method: "eth_estimateGas",
				params: [params],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_estimateGas");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = EstimateGasRequest(params);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			};
			const req = EstimateGasRequest(params);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles simple transfer", () => {
			const params = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				value: "0xde0b6b3a7640000",
			};
			const req = EstimateGasRequest(params);
			expect(req.params?.[0]).toEqual(params);
		});

		test("handles contract deployment", () => {
			const params = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x60806040...",
			};
			const req = EstimateGasRequest(params);
			expect(req.params?.[0]).not.toHaveProperty("to");
			expect(req.params?.[0]).toHaveProperty("data");
		});

		test("handles contract call with data", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
			};
			const req = EstimateGasRequest(params);
			expect(req.params?.[0]).toHaveProperty("data");
		});

		test("handles gas and gasPrice override", () => {
			const params = {
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				gas: "0x100000",
				gasPrice: "0x77359400",
			};
			const req = EstimateGasRequest(params);
			expect(req.params?.[0]).toHaveProperty("gas");
			expect(req.params?.[0]).toHaveProperty("gasPrice");
		});
	});
});
