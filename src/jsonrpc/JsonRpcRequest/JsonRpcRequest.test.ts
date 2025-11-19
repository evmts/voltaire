import { describe, expect, it } from "vitest";
import { JsonRpcRequest, from, withParams } from "./index.js";

describe("JsonRpcRequest", () => {
	describe("from", () => {
		it("creates request with id and method", () => {
			const req = from({
				id: 1,
				method: "eth_blockNumber",
			});
			expect(req).toEqual({
				jsonrpc: "2.0",
				id: 1,
				method: "eth_blockNumber",
			});
		});

		it("creates request with params", () => {
			const req = from({
				id: "test-123",
				method: "eth_getBalance",
				params: ["0x123...", "latest"],
			});
			expect(req).toEqual({
				jsonrpc: "2.0",
				id: "test-123",
				method: "eth_getBalance",
				params: ["0x123...", "latest"],
			});
		});

		it("accepts null id", () => {
			const req = from({
				id: null,
				method: "eth_gasPrice",
			});
			expect(req).toEqual({
				jsonrpc: "2.0",
				id: null,
				method: "eth_gasPrice",
			});
		});

		it("defaults undefined id to null", () => {
			const req = from({
				method: "eth_chainId",
			});
			expect(req).toEqual({
				jsonrpc: "2.0",
				id: null,
				method: "eth_chainId",
			});
		});

		it("throws on invalid request type", () => {
			// @ts-expect-error - Testing invalid input
			expect(() => from(null)).toThrow(TypeError);
			// @ts-expect-error - Testing invalid input
			expect(() => from("invalid")).toThrow(TypeError);
		});

		it("throws on invalid id type", () => {
			expect(() =>
				from({
					// @ts-expect-error - Testing invalid input
					id: {},
					method: "test",
				}),
			).toThrow(TypeError);
		});

		it("throws on invalid method type", () => {
			expect(() =>
				from({
					id: 1,
					// @ts-expect-error - Testing invalid input
					method: 123,
				}),
			).toThrow(TypeError);
		});

		it("throws on missing method", () => {
			expect(() =>
				from({
					id: 1,
					// @ts-expect-error - Testing invalid input
					// method: missing
				}),
			).toThrow(TypeError);
		});
	});

	describe("withParams", () => {
		it("adds params to request", () => {
			const req = from({ id: 1, method: "eth_call" });
			const updated = withParams(req)({ to: "0x123..." });
			expect(updated).toEqual({
				jsonrpc: "2.0",
				id: 1,
				method: "eth_call",
				params: { to: "0x123..." },
			});
		});

		it("replaces existing params", () => {
			const req = from({
				id: 1,
				method: "eth_call",
				params: { old: "data" },
			});
			const updated = withParams(req)({ new: "data" });
			expect(updated).toEqual({
				jsonrpc: "2.0",
				id: 1,
				method: "eth_call",
				params: { new: "data" },
			});
		});

		it("preserves other request fields", () => {
			const req = from({ id: "abc", method: "test" });
			const updated = withParams(req)(["param1", "param2"]);
			expect(updated.jsonrpc).toBe("2.0");
			expect(updated.id).toBe("abc");
			expect(updated.method).toBe("test");
		});
	});

	describe("namespace", () => {
		it("JsonRpcRequest.from() works", () => {
			const req = JsonRpcRequest.from({
				id: 1,
				method: "eth_blockNumber",
			});
			expect(req.jsonrpc).toBe("2.0");
			expect(req.method).toBe("eth_blockNumber");
		});

		it("JsonRpcRequest.withParams() works", () => {
			const req = JsonRpcRequest.from({ id: 1, method: "test" });
			const updated = JsonRpcRequest.withParams(req)({ test: true });
			expect(updated.params).toEqual({ test: true });
		});
	});

	describe("real-world scenarios", () => {
		it("creates eth_blockNumber request", () => {
			const req = from({
				id: 1,
				method: "eth_blockNumber",
			});
			expect(req.method).toBe("eth_blockNumber");
			expect(req.params).toBeUndefined();
		});

		it("creates eth_getBalance request", () => {
			const req = from({
				id: 2,
				method: "eth_getBalance",
				params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"],
			});
			expect(req.params).toHaveLength(2);
		});

		it("creates eth_call request", () => {
			const req = from({
				id: 3,
				method: "eth_call",
				params: [
					{
						to: "0x123...",
						data: "0xabc...",
					},
					"latest",
				],
			});
			expect(req.params).toHaveLength(2);
		});
	});
});
