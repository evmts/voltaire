import { describe, expect, test } from "vitest";
import { GetStorageAtRequest, method } from "./eth_getStorageAt.js";

describe("eth_getStorageAt", () => {
	describe("Request Creation", () => {
		test("creates request with address, position and default block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const position = "0x0";
			const req = GetStorageAtRequest(address, position);
			expect(req).toEqual({
				method: "eth_getStorageAt",
				params: [address, position, "latest"],
			});
		});

		test("creates request with address, position and explicit block", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const position = "0x1";
			const req = GetStorageAtRequest(address, position, "0x5678");
			expect(req).toEqual({
				method: "eth_getStorageAt",
				params: [address, position, "0x5678"],
			});
		});

		test("creates request with block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const position = "0xa";
			const req = GetStorageAtRequest(address, position, "earliest");
			expect(req).toEqual({
				method: "eth_getStorageAt",
				params: [address, position, "earliest"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_getStorageAt");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = GetStorageAtRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				"0x0",
			);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(3);
		});

		test("method matches constant", () => {
			const req = GetStorageAtRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				"0x0",
			);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles storage slot 0", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetStorageAtRequest(address, "0x0");
			expect(req.params?.[1]).toBe("0x0");
		});

		test("handles large storage slot", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const position =
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
			const req = GetStorageAtRequest(address, position);
			expect(req.params?.[1]).toBe(position);
		});

		test("handles pending block tag", () => {
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const req = GetStorageAtRequest(address, "0x0", "pending");
			expect(req.params?.[2]).toBe("pending");
		});
	});
});
