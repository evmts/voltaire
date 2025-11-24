import { describe, expect, test } from "vitest";
import { NewFilterRequest, method } from "./eth_newFilter.js";

describe("eth_newFilter", () => {
	describe("Request Creation", () => {
		test("creates request with filter object", () => {
			const filter = {
				fromBlock: "0x1",
				toBlock: "0x2",
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				topics: [],
			};
			const req = NewFilterRequest(filter);
			expect(req).toEqual({
				method: "eth_newFilter",
				params: [filter],
			});
		});

		test("creates request with topics filter", () => {
			const filter = {
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				],
			};
			const req = NewFilterRequest(filter);
			expect(req).toEqual({
				method: "eth_newFilter",
				params: [filter],
			});
		});

		test("creates request with address and topics", () => {
			const filter = {
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				],
			};
			const req = NewFilterRequest(filter);
			expect(req).toEqual({
				method: "eth_newFilter",
				params: [filter],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_newFilter");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const filter = {
				fromBlock: "latest",
			};
			const req = NewFilterRequest(filter);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const filter = {};
			const req = NewFilterRequest(filter);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles empty filter", () => {
			const filter = {};
			const req = NewFilterRequest(filter);
			expect(req.params?.[0]).toEqual({});
		});

		test("handles multiple addresses", () => {
			const filter = {
				address: [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				],
			};
			const req = NewFilterRequest(filter);
			expect(Array.isArray(req.params?.[0].address)).toBe(true);
		});

		test("handles block range", () => {
			const filter = {
				fromBlock: "0x1",
				toBlock: "latest",
			};
			const req = NewFilterRequest(filter);
			expect(req.params?.[0]).toHaveProperty("fromBlock");
			expect(req.params?.[0]).toHaveProperty("toBlock");
		});

		test("handles nested topics", () => {
			const filter = {
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					null,
					[
						"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
					],
				],
			};
			const req = NewFilterRequest(filter);
			expect(Array.isArray(req.params?.[0].topics)).toBe(true);
		});
	});
});
