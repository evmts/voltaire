/**
 * Batched Provider Tests
 *
 * Comprehensive test suite for the batched provider abstraction.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBatchScheduler } from "./BatchScheduler.js";
import { createBatchedProvider, wrapProvider } from "./BatchedProvider.js";
import type {
	EIP1193Provider,
	JsonRpcRequest,
	JsonRpcResponse,
} from "./BatchedProviderTypes.js";

describe("BatchScheduler", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should batch requests within the debounce window", async () => {
		const execute = vi.fn().mockResolvedValue([
			{ jsonrpc: "2.0", id: 1, result: "0x1" },
			{ jsonrpc: "2.0", id: 2, result: "0x2" },
		]);

		const scheduler = createBatchScheduler({
			wait: 10,
			maxBatchSize: 100,
			execute,
		});

		const p1 = scheduler.schedule({ method: "eth_blockNumber", params: [] });
		const p2 = scheduler.schedule({ method: "eth_chainId", params: [] });

		expect(execute).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(10);

		const [r1, r2] = await Promise.all([p1, p2]);

		expect(execute).toHaveBeenCalledTimes(1);
		expect(execute).toHaveBeenCalledWith([
			{ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] },
			{ jsonrpc: "2.0", id: 2, method: "eth_chainId", params: [] },
		]);
		expect(r1).toBe("0x1");
		expect(r2).toBe("0x2");
	});

	it("should flush immediately when maxBatchSize is reached", async () => {
		const execute = vi
			.fn()
			.mockImplementation((requests: JsonRpcRequest[]) =>
				Promise.resolve(
					requests.map((r) => ({ jsonrpc: "2.0", id: r.id, result: r.id })),
				),
			);

		const scheduler = createBatchScheduler({
			wait: 1000,
			maxBatchSize: 3,
			execute,
		});

		const promises = [
			scheduler.schedule({ method: "m1", params: [] }),
			scheduler.schedule({ method: "m2", params: [] }),
			scheduler.schedule({ method: "m3", params: [] }), // This triggers flush
		];

		// No timer needed - should flush immediately
		await vi.advanceTimersByTimeAsync(0);
		const results = await Promise.all(promises);

		expect(execute).toHaveBeenCalledTimes(1);
		expect(results).toEqual([1, 2, 3]);
	});

	it("should route responses by ID correctly (out of order)", async () => {
		const execute = vi.fn().mockResolvedValue([
			{ jsonrpc: "2.0", id: 3, result: "third" },
			{ jsonrpc: "2.0", id: 1, result: "first" },
			{ jsonrpc: "2.0", id: 2, result: "second" },
		]);

		const scheduler = createBatchScheduler({
			wait: 10,
			maxBatchSize: 100,
			execute,
		});

		const p1 = scheduler.schedule({ method: "m1", params: [] });
		const p2 = scheduler.schedule({ method: "m2", params: [] });
		const p3 = scheduler.schedule({ method: "m3", params: [] });

		await vi.advanceTimersByTimeAsync(10);

		expect(await p1).toBe("first");
		expect(await p2).toBe("second");
		expect(await p3).toBe("third");
	});

	it("should handle per-request errors", async () => {
		const execute = vi.fn().mockResolvedValue([
			{ jsonrpc: "2.0", id: 1, result: "success" },
			{
				jsonrpc: "2.0",
				id: 2,
				error: { code: -32000, message: "execution reverted" },
			},
		]);

		const scheduler = createBatchScheduler({
			wait: 10,
			maxBatchSize: 100,
			execute,
		});

		const p1 = scheduler.schedule({ method: "eth_call", params: [] });
		const p2 = scheduler.schedule({ method: "eth_call", params: [] });

		// Catch p2 early to avoid unhandled rejection warning
		const p2Caught = p2.catch((e) => e);

		await vi.advanceTimersByTimeAsync(10);

		expect(await p1).toBe("success");
		const error = await p2Caught;
		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe("execution reverted");
	});

	it("should reject all on batch-level error", async () => {
		const execute = vi.fn().mockRejectedValue(new Error("Network error"));

		const scheduler = createBatchScheduler({
			wait: 10,
			maxBatchSize: 100,
			execute,
		});

		const p1 = scheduler.schedule({ method: "m1", params: [] });
		const p2 = scheduler.schedule({ method: "m2", params: [] });

		// Catch early to avoid unhandled rejection warnings
		const p1Caught = p1.catch((e) => e);
		const p2Caught = p2.catch((e) => e);

		await vi.advanceTimersByTimeAsync(10);

		const e1 = await p1Caught;
		const e2 = await p2Caught;
		expect(e1.message).toBe("Network error");
		expect(e2.message).toBe("Network error");
	});

	it("should reject on missing response", async () => {
		const execute = vi.fn().mockResolvedValue([
			{ jsonrpc: "2.0", id: 1, result: "found" },
			// id: 2 is missing
		]);

		const scheduler = createBatchScheduler({
			wait: 10,
			maxBatchSize: 100,
			execute,
		});

		const p1 = scheduler.schedule({ method: "m1", params: [] });
		const p2 = scheduler.schedule({ method: "m2", params: [] });

		// Catch early to avoid unhandled rejection warning
		const p2Caught = p2.catch((e) => e);

		await vi.advanceTimersByTimeAsync(10);

		expect(await p1).toBe("found");
		const error = await p2Caught;
		expect(error.message).toBe("Missing response for request id 2");
	});

	it("should force flush with flush()", async () => {
		const execute = vi
			.fn()
			.mockResolvedValue([{ jsonrpc: "2.0", id: 1, result: "flushed" }]);

		const scheduler = createBatchScheduler({
			wait: 1000,
			maxBatchSize: 100,
			execute,
		});

		const p = scheduler.schedule({ method: "m1", params: [] });

		expect(execute).not.toHaveBeenCalled();

		await scheduler.flush();

		expect(execute).toHaveBeenCalledTimes(1);
		expect(await p).toBe("flushed");
	});

	it("should report pending count", async () => {
		const execute = vi.fn().mockResolvedValue([
			{ jsonrpc: "2.0", id: 1, result: "1" },
			{ jsonrpc: "2.0", id: 2, result: "2" },
		]);

		const scheduler = createBatchScheduler({
			wait: 100,
			maxBatchSize: 100,
			execute,
		});

		expect(scheduler.getPendingCount()).toBe(0);

		scheduler.schedule({ method: "m1", params: [] });
		expect(scheduler.getPendingCount()).toBe(1);

		scheduler.schedule({ method: "m2", params: [] });
		expect(scheduler.getPendingCount()).toBe(2);

		await scheduler.flush();
		expect(scheduler.getPendingCount()).toBe(0);
	});
});

describe("BatchedProvider", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should create provider from URL string", () => {
		const provider = createBatchedProvider("https://example.com");
		expect(provider).toBeDefined();
		expect(typeof provider.request).toBe("function");
		expect(typeof provider.flush).toBe("function");
		expect(typeof provider.getPendingCount).toBe("function");
		expect(typeof provider.destroy).toBe("function");
	});

	it("should throw if neither http nor provider is specified", () => {
		expect(() => createBatchedProvider({} as Record<string, never>)).toThrow(
			"Either http.url or provider must be specified",
		);
	});

	it("should batch HTTP requests", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve([
					{ jsonrpc: "2.0", id: 1, result: "0x1234" },
					{ jsonrpc: "2.0", id: 2, result: "0x5678" },
				]),
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 10,
		});

		const p1 = provider.request({ method: "eth_blockNumber", params: [] });
		const p2 = provider.request({ method: "eth_chainId", params: [] });

		await vi.advanceTimersByTimeAsync(10);

		const [r1, r2] = await Promise.all([p1, p2]);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(r1).toBe("0x1234");
		expect(r2).toBe("0x5678");

		// Verify batch format
		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body).toHaveLength(2);
		expect(body[0].method).toBe("eth_blockNumber");
		expect(body[1].method).toBe("eth_chainId");
	});

	it("should handle HTTP errors", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
			text: () => Promise.resolve("Server error"),
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 10,
		});

		const p = provider.request({ method: "eth_blockNumber", params: [] });

		// Catch early to avoid unhandled rejection warning
		const pCaught = p.catch((e) => e);

		await vi.advanceTimersByTimeAsync(10);

		const error = await pCaught;
		expect(error.message).toBe("HTTP 500: Internal Server Error");
	});

	it("should handle timeout", async () => {
		vi.useRealTimers();

		const mockFetch = vi.fn().mockImplementation(
			(_url: string, options: { signal: AbortSignal }) =>
				new Promise((_resolve, reject) => {
					// Listen for abort signal and reject
					options.signal.addEventListener("abort", () => {
						const abortError = new Error("aborted");
						abortError.name = "AbortError";
						reject(abortError);
					});
				}),
		);

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 0,
			timeout: 50,
		});

		const p = provider.request({ method: "eth_blockNumber", params: [] });

		await expect(p).rejects.toThrow(/timed out/);
	}, 10000);

	it("should reject after destroy", async () => {
		const provider = createBatchedProvider("https://example.com");

		provider.destroy();

		await expect(
			provider.request({ method: "eth_blockNumber", params: [] }),
		).rejects.toThrow("Provider has been destroyed");
	});
});

describe("wrapProvider", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should wrap EIP-1193 provider", async () => {
		const mockProvider: EIP1193Provider = {
			request: vi.fn().mockImplementation(({ method }) => {
				if (method === "eth_blockNumber") return Promise.resolve("0x100");
				if (method === "eth_chainId") return Promise.resolve("0x1");
				return Promise.resolve(null);
			}),
		};

		const batched = wrapProvider(mockProvider, { wait: 10 });

		const p1 = batched.request({ method: "eth_blockNumber", params: [] });
		const p2 = batched.request({ method: "eth_chainId", params: [] });

		await vi.advanceTimersByTimeAsync(10);

		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1).toBe("0x100");
		expect(r2).toBe("0x1");

		// Both requests should have been made
		expect(mockProvider.request).toHaveBeenCalledTimes(2);
	});

	it("should handle mixed success/failure in provider batch", async () => {
		const mockProvider: EIP1193Provider = {
			request: vi.fn().mockImplementation(({ method }) => {
				if (method === "success") return Promise.resolve("ok");
				if (method === "fail")
					return Promise.reject({ code: -32000, message: "fail" });
				return Promise.resolve(null);
			}),
		};

		const batched = wrapProvider(mockProvider, { wait: 10 });

		const p1 = batched.request({ method: "success", params: [] });
		const p2 = batched.request({ method: "fail", params: [] });

		// Catch early to avoid unhandled rejection warning
		const p2Caught = p2.catch((e) => e);

		await vi.advanceTimersByTimeAsync(10);

		expect(await p1).toBe("ok");
		const error = await p2Caught;
		expect(error.code).toBe(-32000);
	});
});

describe("Mixed method batching", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should handle mixed methods in same batch", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve([
					{ jsonrpc: "2.0", id: 1, result: "0x1234567" },
					{ jsonrpc: "2.0", id: 2, result: "0xde0b6b3a7640000" },
					{ jsonrpc: "2.0", id: 3, result: "0x608060405234801561001057" },
				]),
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 10,
		});

		const promises = [
			provider.request({ method: "eth_blockNumber", params: [] }),
			provider.request({
				method: "eth_getBalance",
				params: ["0x1234567890123456789012345678901234567890", "latest"],
			}),
			provider.request({
				method: "eth_getCode",
				params: ["0x1234567890123456789012345678901234567890", "latest"],
			}),
		];

		await vi.advanceTimersByTimeAsync(10);

		const [blockNumber, balance, code] = await Promise.all(promises);

		expect(blockNumber).toBe("0x1234567");
		expect(balance).toBe("0xde0b6b3a7640000");
		expect(code).toBe("0x608060405234801561001057");
	});
});

describe("Edge cases", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should handle empty params", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve([{ jsonrpc: "2.0", id: 1, result: "0x1" }]),
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 10,
		});

		const p = provider.request({ method: "eth_blockNumber" });

		await vi.advanceTimersByTimeAsync(10);

		expect(await p).toBe("0x1");

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body[0].params).toEqual([]);
	});

	it("should handle single response (not array)", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: "0x1" }),
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 10,
		});

		const p = provider.request({ method: "eth_blockNumber", params: [] });

		await vi.advanceTimersByTimeAsync(10);

		expect(await p).toBe("0x1");
	});

	it("should preserve error code and data", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve([
					{
						jsonrpc: "2.0",
						id: 1,
						error: {
							code: -32015,
							message: "VM execution error",
							data: "0x08c379a00000000000000000000000000000000000000000000000000000000000000020",
						},
					},
				]),
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 10,
		});

		const p = provider.request({ method: "eth_call", params: [] });

		// Catch early to avoid unhandled rejection warning
		const pCaught = p.catch((e) => e);

		await vi.advanceTimersByTimeAsync(10);

		const error = await pCaught;
		expect(error.code).toBe(-32015);
		expect(error.data).toBe(
			"0x08c379a00000000000000000000000000000000000000000000000000000000000000020",
		);
	});

	it("should handle rapid sequential requests", async () => {
		const mockFetch = vi.fn().mockImplementation((url, opts) => {
			const body = JSON.parse(opts.body);
			return Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve(
						body.map((r: JsonRpcRequest) => ({
							jsonrpc: "2.0",
							id: r.id,
							result: `result-${r.id}`,
						})),
					),
			});
		});

		const provider = createBatchedProvider({
			http: { url: "https://example.com", fetchFn: mockFetch },
			wait: 5,
			maxBatchSize: 100,
		});

		// First batch
		const batch1 = [
			provider.request({ method: "m1", params: [] }),
			provider.request({ method: "m2", params: [] }),
		];

		await vi.advanceTimersByTimeAsync(5);

		// Second batch (after first one sent)
		const batch2 = [
			provider.request({ method: "m3", params: [] }),
			provider.request({ method: "m4", params: [] }),
		];

		await vi.advanceTimersByTimeAsync(5);

		const results1 = await Promise.all(batch1);
		const results2 = await Promise.all(batch2);

		expect(results1).toEqual(["result-1", "result-2"]);
		expect(results2).toEqual(["result-3", "result-4"]);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});
});
