import { describe, expect, test } from "vitest";
import { SignTransactionRequest, method } from "./eth_signTransaction.js";

describe("eth_signTransaction", () => {
	describe("Request Creation", () => {
		test("creates request with transaction params", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				value: "0xde0b6b3a7640000",
			};
			const req = SignTransactionRequest(txParams);
			expect(req).toEqual({
				method: "eth_signTransaction",
				params: [txParams],
			});
		});

		test("creates request with full transaction params", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				gas: "0x5208",
				gasPrice: "0x3b9aca00",
				value: "0xde0b6b3a7640000",
				data: "0xa9059cbb",
				nonce: "0x1",
			};
			const req = SignTransactionRequest(txParams);
			expect(req).toEqual({
				method: "eth_signTransaction",
				params: [txParams],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_signTransaction");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
			};
			const req = SignTransactionRequest(txParams);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
			};
			const req = SignTransactionRequest(txParams);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles simple transfer", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				value: "0xde0b6b3a7640000",
			};
			const req = SignTransactionRequest(txParams);
			expect(req.params?.[0]).toEqual(txParams);
		});

		test("handles contract deployment", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				data: "0x60806040...",
			};
			const req = SignTransactionRequest(txParams);
			expect(req.params?.[0]).not.toHaveProperty("to");
		});

		test("handles EIP-1559 params", () => {
			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				maxFeePerGas: "0x3b9aca00",
				maxPriorityFeePerGas: "0x3b9aca00",
			};
			const req = SignTransactionRequest(txParams);
			expect(req.params?.[0]).toHaveProperty("maxFeePerGas");
			expect(req.params?.[0]).toHaveProperty("maxPriorityFeePerGas");
		});
	});
});
