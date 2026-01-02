import { describe, expect, test } from "vitest";
import { method, SubscribeRequest } from "./eth_subscribe.js";

describe("eth_subscribe", () => {
	describe("Request Creation", () => {
		test("creates request with newHeads subscription", () => {
			const req = SubscribeRequest("newHeads");
			expect(req).toEqual({
				method: "eth_subscribe",
				params: ["newHeads"],
			});
		});

		test("creates request with logs subscription and filter", () => {
			const filter = {
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				],
			};
			const req = SubscribeRequest("logs", filter);
			expect(req).toEqual({
				method: "eth_subscribe",
				params: ["logs", filter],
			});
		});

		test("creates request with newPendingTransactions subscription", () => {
			const req = SubscribeRequest("newPendingTransactions");
			expect(req).toEqual({
				method: "eth_subscribe",
				params: ["newPendingTransactions"],
			});
		});

		test("creates request with syncing subscription", () => {
			const req = SubscribeRequest("syncing");
			expect(req).toEqual({
				method: "eth_subscribe",
				params: ["syncing"],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_subscribe");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const req = SubscribeRequest("newHeads");
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params.length).toBeGreaterThanOrEqual(1);
		});

		test("method matches constant", () => {
			const req = SubscribeRequest("newHeads");
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles logs subscription without params", () => {
			const req = SubscribeRequest("logs");
			expect(req.params).toHaveLength(1);
		});

		test("handles logs subscription with empty filter", () => {
			const req = SubscribeRequest("logs", {});
			expect(req.params).toHaveLength(2);
		});

		test("handles logs subscription with multiple addresses", () => {
			const filter = {
				address: [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
				],
			};
			const req = SubscribeRequest("logs", filter);
			expect(req.params?.[1]).toHaveProperty("address");
		});

		test("handles logs subscription with topics", () => {
			const filter = {
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					null,
					[
						"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
					],
				],
			};
			const req = SubscribeRequest("logs", filter);
			expect(req.params?.[1]).toHaveProperty("topics");
		});
	});
});
