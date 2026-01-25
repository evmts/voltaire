import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	BrowserTransport,
	FallbackTransport,
	HttpTransport,
	TestTransport,
	TransportError,
	TransportService,
	WebSocketTransport,
} from "./index.js";

describe("TransportService", () => {
	describe("TestTransport", () => {
		it("returns mocked responses", async () => {
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(Effect.provide(TestTransport({ eth_blockNumber: "0x1234" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1234");
		});

		it("returns mocked responses from Map", async () => {
			const responses = new Map([["eth_chainId", "0x1"]]);
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_chainId", []);
			}).pipe(Effect.provide(TestTransport(responses)));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
		});

		it("fails for unknown methods", async () => {
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_unknown", []);
			}).pipe(Effect.provide(TestTransport({})));

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("can mock errors", async () => {
			const responses = new Map([
				[
					"eth_call",
					new TransportError({ code: -32000, message: "execution reverted" }),
				],
			]);
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_call", []);
			}).pipe(Effect.provide(TestTransport(responses)));

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});
	});

	describe("HttpTransport", () => {
		let fetchMock: ReturnType<typeof vi.fn>;
		const originalFetch = globalThis.fetch;

		beforeEach(() => {
			fetchMock = vi.fn();
			globalThis.fetch = fetchMock as unknown as typeof fetch;
		});

		afterEach(() => {
			globalThis.fetch = originalFetch;
		});

		it("makes JSON-RPC requests", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x5678" }),
			});

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(HttpTransport({ url: "https://eth.example.com" })),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x5678");

			expect(fetchMock).toHaveBeenCalled();
		});

		it("accepts string URL shorthand", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
			});

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_chainId", []);
			}).pipe(Effect.provide(HttpTransport("https://eth.example.com")));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
		});

		it("includes custom headers", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
			});

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_chainId", []);
			}).pipe(
				Effect.provide(
					HttpTransport({
						url: "https://eth.example.com",
						headers: { "X-Api-Key": "secret" },
					}),
				),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
			expect(fetchMock).toHaveBeenCalled();
		});

		it("handles JSON-RPC errors", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					error: { code: -32000, message: "execution reverted" },
				}),
			});

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_call", []);
			}).pipe(
				Effect.provide(HttpTransport({ url: "https://eth.example.com" })),
			);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure") {
				const error = exit.cause;
				expect(error._tag).toBe("Fail");
			}
		});

		it("handles HTTP errors", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 429,
				statusText: "Too Many Requests",
			});

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(
					HttpTransport({ url: "https://eth.example.com", retries: 0 }),
				),
			);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		describe("batching", () => {
			it("batches concurrent requests into single HTTP call", async () => {
				fetchMock.mockImplementation(() =>
					Promise.resolve({
						ok: true,
						json: async () => [
							{ jsonrpc: "2.0", id: 1, result: "0x100" },
							{ jsonrpc: "2.0", id: 2, result: "0x1" },
							{ jsonrpc: "2.0", id: 3, result: "0x5f5e100" },
						],
					}),
				);

				const program = Effect.gen(function* () {
					const transport = yield* TransportService;
					return yield* Effect.all([
						transport.request<string>("eth_blockNumber", []),
						transport.request<string>("eth_chainId", []),
						transport.request<string>("eth_gasPrice", []),
					]);
				}).pipe(
					Effect.provide(
						HttpTransport({
							url: "https://eth.example.com",
							batch: { batchSize: 100, wait: 10 },
							retries: 0,
						}),
					),
				);

				const [blockNumber, chainId, gasPrice] = await Effect.runPromise(program);
				expect(blockNumber).toBe("0x100");
				expect(chainId).toBe("0x1");
				expect(gasPrice).toBe("0x5f5e100");
				expect(fetchMock).toHaveBeenCalledTimes(1);

				const call = fetchMock.mock.calls[0];
				const body = JSON.parse(call[1].body);
				expect(body).toHaveLength(3);
				expect(body[0].method).toBe("eth_blockNumber");
				expect(body[1].method).toBe("eth_chainId");
				expect(body[2].method).toBe("eth_gasPrice");
			});

			it("handles individual request errors in batch", async () => {
				fetchMock.mockImplementation(() =>
					Promise.resolve({
						ok: true,
						json: async () => [
							{ jsonrpc: "2.0", id: 1, result: "0x100" },
							{ jsonrpc: "2.0", id: 2, error: { code: -32000, message: "execution reverted" } },
						],
					}),
				);

				const program = Effect.gen(function* () {
					const transport = yield* TransportService;
					const results = yield* Effect.all(
						[
							transport.request<string>("eth_blockNumber", []),
							transport.request<string>("eth_call", []),
						],
						{ concurrency: "unbounded", mode: "either" },
					);
					return results;
				}).pipe(
					Effect.provide(
						HttpTransport({
							url: "https://eth.example.com",
							batch: { batchSize: 100, wait: 10 },
							retries: 0,
						}),
					),
				);

				const results = await Effect.runPromise(program);
				expect(results[0]._tag).toBe("Right");
				expect(results[1]._tag).toBe("Left");
			});

			it("flushes batch on size limit", async () => {
				let callCount = 0;
				fetchMock.mockImplementation(() => {
					callCount++;
					if (callCount === 1) {
						return Promise.resolve({
							ok: true,
							json: async () => [
								{ jsonrpc: "2.0", id: 1, result: "0x1" },
								{ jsonrpc: "2.0", id: 2, result: "0x2" },
							],
						});
					}
					return Promise.resolve({
						ok: true,
						json: async () => [{ jsonrpc: "2.0", id: 3, result: "0x3" }],
					});
				});

				const program = Effect.gen(function* () {
					const transport = yield* TransportService;
					return yield* Effect.all([
						transport.request<string>("eth_blockNumber", []),
						transport.request<string>("eth_chainId", []),
						transport.request<string>("eth_gasPrice", []),
					]);
				}).pipe(
					Effect.provide(
						HttpTransport({
							url: "https://eth.example.com",
							batch: { batchSize: 2, wait: 50 },
							retries: 0,
						}),
					),
				);

				const results = await Effect.runPromise(program);
				expect(results).toEqual(["0x1", "0x2", "0x3"]);
				expect(fetchMock).toHaveBeenCalledTimes(2);
			});

			it("fails all requests on HTTP error", async () => {
				fetchMock.mockImplementation(() =>
					Promise.resolve({
						ok: false,
						status: 500,
						statusText: "Internal Server Error",
					}),
				);

				const program = Effect.gen(function* () {
					const transport = yield* TransportService;
					return yield* Effect.all(
						[
							transport.request<string>("eth_blockNumber", []),
							transport.request<string>("eth_chainId", []),
						],
						{ concurrency: "unbounded", mode: "either" },
					);
				}).pipe(
					Effect.provide(
						HttpTransport({
							url: "https://eth.example.com",
							batch: { batchSize: 100, wait: 10 },
							retries: 0,
						}),
					),
				);

				const results = await Effect.runPromise(program);
				expect(results[0]._tag).toBe("Left");
				expect(results[1]._tag).toBe("Left");
			});
		});
	});

	describe("BrowserTransport", () => {
		const originalWindow = globalThis.window;

		afterEach(() => {
			(globalThis as unknown as { window: typeof window }).window =
				originalWindow;
		});

		it("fails when no browser wallet", async () => {
			(globalThis as unknown as { window: undefined }).window = undefined;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_accounts", []);
			}).pipe(Effect.provide(BrowserTransport));

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("calls window.ethereum.request", async () => {
			const mockRequest = vi
				.fn()
				.mockResolvedValue(["0x1234567890123456789012345678901234567890"]);
			(
				globalThis as unknown as {
					window: { ethereum: { request: typeof mockRequest } };
				}
			).window = {
				ethereum: { request: mockRequest },
			};

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string[]>("eth_accounts", []);
			}).pipe(Effect.provide(BrowserTransport));

			const result = await Effect.runPromise(program);
			expect(result).toEqual(["0x1234567890123456789012345678901234567890"]);
			expect(mockRequest).toHaveBeenCalledWith({
				method: "eth_accounts",
				params: [],
			});
		});
	});

	describe("FallbackTransport", () => {
		it("uses first transport when available", async () => {
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(
					FallbackTransport([
						TestTransport({ eth_blockNumber: "0x1" }),
						TestTransport({ eth_blockNumber: "0x2" }),
					]),
				),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
		});

		it("fails over to next transport on error", async () => {
			const failingTransport = TestTransport(
				new Map([
					[
						"eth_blockNumber",
						new TransportError({ code: -32603, message: "Primary failed" }),
					],
				]),
			);

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(
					FallbackTransport(
						[failingTransport, TestTransport({ eth_blockNumber: "0xBackup" })],
						{ retryCount: 1 },
					),
				),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xBackup");
		});

		it("fails when all transports fail", async () => {
			const error = new TransportError({ code: -32603, message: "Failed" });
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(
					FallbackTransport(
						[
							TestTransport(new Map([["eth_blockNumber", error]])),
							TestTransport(new Map([["eth_blockNumber", error]])),
						],
						{ retryCount: 1 },
					),
				),
			);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("recovers failed transports after reset", async () => {
			const error = new TransportError({
				code: -32603,
				message: "Primary failed",
			});
			const failingTransport = TestTransport(
				new Map([["eth_blockNumber", error]]),
			);
			const backupTransport = TestTransport({ eth_blockNumber: "0xBackup" });

			const fallback = FallbackTransport(
				[failingTransport, backupTransport],
				{ retryCount: 1 },
			);

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(Effect.provide(fallback));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xBackup");
		});

		it("supports latency-based ranking", async () => {
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(
					FallbackTransport(
						[
							TestTransport({ eth_blockNumber: "0x1" }),
							TestTransport({ eth_blockNumber: "0x2" }),
						],
						{ rank: true },
					),
				),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
		});
	});

	describe("WebSocketTransport", () => {
		const originalWebSocket = globalThis.WebSocket;

		afterEach(() => {
			globalThis.WebSocket = originalWebSocket;
		});

		it("handles concurrent requests correctly", async () => {
			const pendingMessages: Array<{
				id: number;
				resolve: (data: string) => void;
			}> = [];
			let messageHandler: ((event: { data: string }) => void) | null = null;
			let openHandler: (() => void) | null = null;

			const MockWebSocket = vi.fn().mockImplementation(() => {
				const ws = {
					readyState: 1,
					OPEN: 1,
					send: vi.fn((data: string) => {
						const parsed = JSON.parse(data);
						pendingMessages.push({
							id: parsed.id,
							resolve: (result: string) => {
								if (messageHandler) {
									messageHandler({
										data: JSON.stringify({
											jsonrpc: "2.0",
											id: parsed.id,
											result,
										}),
									});
								}
							},
						});
					}),
					close: vi.fn(),
					set onopen(handler: () => void) {
						openHandler = handler;
						setTimeout(() => handler(), 0);
					},
					set onmessage(handler: (event: { data: string }) => void) {
						messageHandler = handler;
					},
					set onerror(_handler: () => void) {},
					set onclose(_handler: () => void) {},
				};
				Object.defineProperty(ws, "readyState", {
					get: () => 1,
				});
				return ws;
			});
			(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				const fibers = yield* Effect.all(
					Array.from({ length: 100 }, (_, i) =>
						Effect.fork(transport.request<string>("eth_blockNumber", [])),
					),
				);

				yield* Effect.sleep(10);

				for (const msg of pendingMessages) {
					msg.resolve(`0x${msg.id.toString(16)}`);
				}

				const results = yield* Effect.all(fibers.map((f) => Fiber.join(f)));
				return results;
			}).pipe(
				Effect.provide(WebSocketTransport("ws://localhost:8545")),
				Effect.scoped,
			);

			const results = await Effect.runPromise(program);
			expect(results).toHaveLength(100);

			const uniqueResults = new Set(results);
			expect(uniqueResults.size).toBe(100);
		});

		it("reconnects after disconnect", async () => {
			let connectionCount = 0;
			let messageHandler: ((event: { data: string }) => void) | null = null;
			let closeHandler: (() => void) | null = null;
			let currentWs: { readyState: number; close: () => void } | null = null;

			const MockWebSocket = vi.fn().mockImplementation(() => {
				connectionCount++;
				const ws = {
					readyState: 1,
					OPEN: 1,
					send: vi.fn((data: string) => {
						const parsed = JSON.parse(data);
						if (parsed.method !== "web3_clientVersion") {
							setTimeout(() => {
								if (messageHandler) {
									messageHandler({
										data: JSON.stringify({
											jsonrpc: "2.0",
											id: parsed.id,
											result: `0x${connectionCount}`,
										}),
									});
								}
							}, 0);
						}
					}),
					close: vi.fn(),
					set onopen(handler: () => void) {
						setTimeout(() => handler(), 0);
					},
					set onmessage(handler: (event: { data: string }) => void) {
						messageHandler = handler;
					},
					set onerror(_handler: () => void) {},
					set onclose(handler: () => void) {
						closeHandler = handler;
					},
				};
				Object.defineProperty(ws, "readyState", {
					get: () => 1,
				});
				currentWs = ws;
				return ws;
			});
			(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				const result1 = yield* transport.request<string>("eth_blockNumber", []);
				expect(result1).toBe("0x1");

				if (closeHandler) closeHandler();

				yield* Effect.sleep(50);

				const result2 = yield* transport.request<string>("eth_blockNumber", []);
				expect(result2).toBe("0x2");

				return { result1, result2, connectionCount };
			}).pipe(
				Effect.provide(
					WebSocketTransport({
						url: "ws://localhost:8545",
						reconnect: { delay: 10, maxAttempts: 3 },
					}),
				),
				Effect.scoped,
			);

			const result = await Effect.runPromise(program);
			expect(result.connectionCount).toBe(2);
		});

		it("uses exponential backoff for reconnection", async () => {
			let connectionTimes: number[] = [];
			let messageHandler: ((event: { data: string }) => void) | null = null;
			let closeHandler: (() => void) | null = null;
			let connectionCount = 0;

			const MockWebSocket = vi.fn().mockImplementation(() => {
				connectionTimes.push(Date.now());
				connectionCount++;
				const currentConnection = connectionCount;
				const ws = {
					readyState: 1,
					OPEN: 1,
					send: vi.fn((data: string) => {
						const parsed = JSON.parse(data);
						const handler = messageHandler;
						if (parsed.method !== "web3_clientVersion" && handler) {
							setTimeout(() => {
								handler({
									data: JSON.stringify({
										jsonrpc: "2.0",
										id: parsed.id,
										result: "0x1",
									}),
								});
							}, 0);
						}
					}),
					close: vi.fn(),
					set onopen(handler: () => void) {
						setTimeout(() => handler(), 0);
					},
					set onmessage(handler: (event: { data: string }) => void) {
						messageHandler = handler;
					},
					set onerror(_handler: () => void) {},
					set onclose(handler: () => void) {
						closeHandler = handler;
					},
				};
				Object.defineProperty(ws, "readyState", {
					get: () => 1,
				});
				return ws;
			});
			(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				yield* transport.request<string>("eth_blockNumber", []);

				if (closeHandler) closeHandler();
				yield* Effect.sleep(15);
				if (closeHandler) closeHandler();
				yield* Effect.sleep(30);
				if (closeHandler) closeHandler();
				yield* Effect.sleep(60);

				return connectionTimes;
			}).pipe(
				Effect.provide(
					WebSocketTransport({
						url: "ws://localhost:8545",
						reconnect: { delay: 10, multiplier: 2, maxAttempts: 10 },
					}),
				),
				Effect.scoped,
			);

			const times = await Effect.runPromise(program);

			expect(times.length).toBeGreaterThanOrEqual(3);
			if (times.length >= 3) {
				const delay1 = times[1] - times[0];
				const delay2 = times[2] - times[1];
				expect(delay2).toBeGreaterThanOrEqual(delay1 * 0.8);
			}
		});

		it("fails after max reconnection attempts", async () => {
			let connectionCount = 0;
			let closeHandler: (() => void) | null = null;

			const MockWebSocket = vi.fn().mockImplementation(() => {
				connectionCount++;
				const ws = {
					readyState: 3,
					OPEN: 1,
					CLOSED: 3,
					send: vi.fn(),
					close: vi.fn(),
					set onopen(handler: () => void) {
						if (connectionCount === 1) {
							setTimeout(() => handler(), 0);
						}
					},
					set onmessage(handler: (event: { data: string }) => void) {},
					set onerror(_handler: () => void) {},
					set onclose(handler: () => void) {
						closeHandler = handler;
						if (connectionCount > 1) {
							setTimeout(() => handler(), 0);
						}
					},
				};
				Object.defineProperty(ws, "readyState", {
					get: () => (connectionCount === 1 ? 1 : 3),
				});
				return ws;
			});
			(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				if (closeHandler) closeHandler();

				yield* Effect.sleep(200);

				return yield* transport.request<string>("eth_blockNumber", []);
			}).pipe(
				Effect.provide(
					WebSocketTransport({
						url: "ws://localhost:8545",
						reconnect: { delay: 10, maxAttempts: 3 },
						timeout: 500,
					}),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("queues requests during reconnection", async () => {
			let connectionCount = 0;
			let messageHandler: ((event: { data: string }) => void) | null = null;
			let closeHandler: (() => void) | null = null;
			let isConnected = false;

			const MockWebSocket = vi.fn().mockImplementation(() => {
				connectionCount++;
				const ws = {
					readyState: 1,
					OPEN: 1,
					send: vi.fn((data: string) => {
						const parsed = JSON.parse(data);
						if (parsed.method !== "web3_clientVersion") {
							setTimeout(() => {
								if (messageHandler && isConnected) {
									messageHandler({
										data: JSON.stringify({
											jsonrpc: "2.0",
											id: parsed.id,
											result: `0x${parsed.id}`,
										}),
									});
								}
							}, 0);
						}
					}),
					close: vi.fn(),
					set onopen(handler: () => void) {
						setTimeout(() => {
							isConnected = true;
							handler();
						}, connectionCount === 1 ? 0 : 30);
					},
					set onmessage(handler: (event: { data: string }) => void) {
						messageHandler = handler;
					},
					set onerror(_handler: () => void) {},
					set onclose(handler: () => void) {
						closeHandler = handler;
					},
				};
				Object.defineProperty(ws, "readyState", {
					get: () => (isConnected ? 1 : 0),
				});
				return ws;
			});
			(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				const result1 = yield* transport.request<string>("eth_blockNumber", []);
				expect(result1).toBe("0x1");

				isConnected = false;
				if (closeHandler) closeHandler();

				const requestFiber = yield* Effect.fork(
					transport.request<string>("eth_chainId", []),
				);

				yield* Effect.sleep(100);

				const result2 = yield* Fiber.join(requestFiber);
				expect(result2).toBe("0x2");

				return { result1, result2 };
			}).pipe(
				Effect.provide(
					WebSocketTransport({
						url: "ws://localhost:8545",
						reconnect: { delay: 10, maxAttempts: 3 },
					}),
				),
				Effect.scoped,
			);

			await Effect.runPromise(program);
		});

		it("sends keep-alive pings", async () => {
			const sentMessages: string[] = [];
			let messageHandler: ((event: { data: string }) => void) | null = null;

			const MockWebSocket = vi.fn().mockImplementation(() => {
				const ws = {
					readyState: 1,
					OPEN: 1,
					send: vi.fn((data: string) => {
						sentMessages.push(data);
						const parsed = JSON.parse(data);
						if (parsed.method !== "web3_clientVersion") {
							setTimeout(() => {
								if (messageHandler) {
									messageHandler({
										data: JSON.stringify({
											jsonrpc: "2.0",
											id: parsed.id,
											result: "0x1",
										}),
									});
								}
							}, 0);
						}
					}),
					close: vi.fn(),
					set onopen(handler: () => void) {
						setTimeout(() => handler(), 0);
					},
					set onmessage(handler: (event: { data: string }) => void) {
						messageHandler = handler;
					},
					set onerror(_handler: () => void) {},
					set onclose(_handler: () => void) {},
				};
				Object.defineProperty(ws, "readyState", {
					get: () => 1,
				});
				return ws;
			});
			(MockWebSocket as unknown as { OPEN: number }).OPEN = 1;
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				yield* Effect.sleep(150);

				const keepAliveMessages = sentMessages.filter((msg) => {
					const parsed = JSON.parse(msg);
					return parsed.method === "web3_clientVersion" && parsed.id === "keepalive";
				});

				return keepAliveMessages.length;
			}).pipe(
				Effect.provide(
					WebSocketTransport({
						url: "ws://localhost:8545",
						keepAlive: 50,
					}),
				),
				Effect.scoped,
			);

			const keepAliveCount = await Effect.runPromise(program);
			expect(keepAliveCount).toBeGreaterThanOrEqual(2);
		});
	});
});
