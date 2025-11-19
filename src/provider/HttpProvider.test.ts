/**
 * HttpProvider Tests - EIP-1193 Compliant
 *
 * Tests HttpProvider implementation:
 * - request() method instead of individual methods
 * - Throws errors instead of returning Response<T> unions
 * - EventEmitter pattern
 * - EIP-1193 error codes
 *
 * NOTE: These tests are currently SKIPPED as they test the future EIP-1193
 * compliant interface. Current HttpProvider uses individual methods and
 * Response<T> unions. These tests will be enabled when the implementation
 * is migrated to EIP-1193.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { HttpProvider } from "./HttpProvider.js";

describe.skip("HttpProvider - EIP-1193 (Future Implementation)", () => {
	let provider: HttpProvider;
	const mockUrl = "http://localhost:8545";

	beforeEach(() => {
		provider = new HttpProvider(mockUrl);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("request() method", () => {
		it("executes eth_blockNumber via request()", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x1234",
				}),
			});
			global.fetch = mockFetch;

			const result = await provider.request({
				method: "eth_blockNumber",
			});

			expect(result).toBe("0x1234");
			expect(mockFetch).toHaveBeenCalled();
		});

		it("executes eth_getBalance via request() with params", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0xde0b6b3a7640000",
				}),
			});
			global.fetch = mockFetch;

			const result = await provider.request({
				method: "eth_getBalance",
				params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
			});

			expect(result).toBe("0xde0b6b3a7640000");
		});

		it("executes eth_call via request()", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0xabcdef",
				}),
			});
			global.fetch = mockFetch;

			const result = await provider.request({
				method: "eth_call",
				params: [
					{
						to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
						data: "0x12345678",
					},
					"latest",
				],
			});

			expect(result).toBe("0xabcdef");
		});

		it("accepts RequestArguments interface", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x1",
				}),
			});
			global.fetch = mockFetch;

			const args = {
				method: "eth_chainId" as const,
			};

			const result = await provider.request(args);
			expect(result).toBe("0x1");
		});
	});

	describe("Error Handling - Throws Instead of Response Union", () => {
		it("throws on network error", async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
			global.fetch = mockFetch;

			await expect(
				provider.request({ method: "eth_blockNumber" }),
			).rejects.toThrow();
		});

		it("throws on HTTP error status", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});
			global.fetch = mockFetch;

			await expect(
				provider.request({ method: "eth_blockNumber" }),
			).rejects.toThrow();
		});

		it("throws on JSON-RPC error response", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					error: {
						code: -32601,
						message: "Method not found",
					},
				}),
			});
			global.fetch = mockFetch;

			await expect(
				provider.request({ method: "eth_unknown" }),
			).rejects.toMatchObject({
				code: -32601,
				message: "Method not found",
			});
		});

		it("throws with EIP-1193 error codes", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					error: {
						code: 4200,
						message: "Unsupported method",
					},
				}),
			});
			global.fetch = mockFetch;

			await expect(
				provider.request({ method: "eth_customMethod" }),
			).rejects.toMatchObject({
				code: 4200,
				message: "Unsupported method",
			});
		});

		it("error includes optional data field", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					error: {
						code: -32602,
						message: "Invalid params",
						data: { param: "address", issue: "invalid format" },
					},
				}),
			});
			global.fetch = mockFetch;

			try {
				await provider.request({
					method: "eth_getBalance",
					params: ["invalid"],
				});
			} catch (error: any) {
				expect(error.data).toEqual({
					param: "address",
					issue: "invalid format",
				});
			}
		});

		it("does NOT return Response<T> union", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x1234",
				}),
			});
			global.fetch = mockFetch;

			const result = await provider.request({ method: "eth_blockNumber" });

			expect(result).toBe("0x1234");
			expect(result).not.toHaveProperty("error");
			expect(result).not.toHaveProperty("result");
		});
	});

	describe("EventEmitter Interface", () => {
		it("has on() method", () => {
			expect(provider.on).toBeDefined();
			expect(typeof provider.on).toBe("function");
		});

		it("has removeListener() method", () => {
			expect(provider.removeListener).toBeDefined();
			expect(typeof provider.removeListener).toBe("function");
		});

		it("on() returns provider for chaining", () => {
			const listener = vi.fn();
			const result = provider.on("chainChanged", listener);

			expect(result).toBe(provider);
		});

		it("removeListener() returns provider for chaining", () => {
			const listener = vi.fn();
			const result = provider.removeListener("chainChanged", listener);

			expect(result).toBe(provider);
		});

		it("supports connect event", () => {
			const listener = vi.fn();
			provider.on("connect", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports disconnect event", () => {
			const listener = vi.fn();
			provider.on("disconnect", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports chainChanged event", () => {
			const listener = vi.fn();
			provider.on("chainChanged", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports accountsChanged event", () => {
			const listener = vi.fn();
			provider.on("accountsChanged", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports message event", () => {
			const listener = vi.fn();
			provider.on("message", listener);

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("Constructor Options", () => {
		it("accepts string URL", () => {
			const p = new HttpProvider("https://eth.example.com");
			expect(p).toBeDefined();
		});

		it("accepts options object", () => {
			const p = new HttpProvider({
				url: "https://eth.example.com",
				timeout: 5000,
				headers: { "X-Custom": "value" },
			});
			expect(p).toBeDefined();
		});

		it("applies custom timeout", async () => {
			const p = new HttpProvider({
				url: mockUrl,
				timeout: 100,
			});

			const mockFetch = vi.fn(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => ({ result: "0x1" }),
								}),
							200,
						),
					),
			);
			global.fetch = mockFetch;

			await expect(p.request({ method: "eth_chainId" })).rejects.toThrow();
		});

		it("applies custom headers", async () => {
			const p = new HttpProvider({
				url: mockUrl,
				headers: { "X-Custom-Header": "test-value" },
			});

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x1",
				}),
			});
			global.fetch = mockFetch;

			await p.request({ method: "eth_chainId" });

			const fetchCall = mockFetch.mock.calls[0];
			expect(fetchCall[1].headers).toMatchObject({
				"X-Custom-Header": "test-value",
			});
		});
	});

	describe("Batch Requests", () => {
		it("supports batch request via request() with array", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => [
					{ jsonrpc: "2.0", id: 1, result: "0x1234" },
					{ jsonrpc: "2.0", id: 2, result: "0x1" },
				],
			});
			global.fetch = mockFetch;

			const results = await Promise.all([
				provider.request({ method: "eth_blockNumber" }),
				provider.request({ method: "eth_chainId" }),
			]);

			expect(results).toHaveLength(2);
		});
	});

	describe("Method Coverage", () => {
		it("supports all eth namespace methods via request()", async () => {
			const methods = [
				"eth_accounts",
				"eth_blockNumber",
				"eth_call",
				"eth_chainId",
				"eth_gasPrice",
				"eth_getBalance",
				"eth_getCode",
				"eth_getTransactionByHash",
				"eth_getTransactionReceipt",
				"eth_sendRawTransaction",
			];

			for (const method of methods) {
				const mockFetch = vi.fn().mockResolvedValue({
					ok: true,
					json: async () => ({
						jsonrpc: "2.0",
						id: 1,
						result: "0x0",
					}),
				});
				global.fetch = mockFetch;

				await provider.request({ method });

				const body = JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(body.method).toBe(method);
			}
		});

		it("supports debug namespace methods via request()", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: {},
				}),
			});
			global.fetch = mockFetch;

			await provider.request({
				method: "debug_traceTransaction",
				params: ["0x123"],
			});

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.method).toBe("debug_traceTransaction");
		});

		it("supports engine namespace methods via request()", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: { status: "VALID" },
				}),
			});
			global.fetch = mockFetch;

			await provider.request({
				method: "engine_newPayloadV1",
				params: [{}],
			});

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.method).toBe("engine_newPayloadV1");
		});
	});
});
