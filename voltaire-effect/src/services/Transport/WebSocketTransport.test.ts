/**
 * WebSocketTransport unit tests.
 *
 * Uses a lightweight mock WebSocket implementation that supports addEventListener,
 * matching @effect/platform Socket expectations.
 */
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import { afterEach, describe, expect, it } from "@effect/vitest";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";
import { WebSocketConstructorGlobal, WebSocketTransport } from "./WebSocketTransport.js";
import { makeMockWebSocket } from "./__testUtils__/mockWebSocket.js";

describe("WebSocketTransport", () => {
	const originalWebSocket = globalThis.WebSocket;

	afterEach(() => {
		globalThis.WebSocket = originalWebSocket;
	});

	describe("configuration", () => {
		it("accepts string URL configuration", () => {
			const layer = WebSocketTransport("wss://test.example.com");
			expect(Layer.isLayer(layer)).toBe(true);
		});

		it("accepts object configuration with all options", () => {
			const layer = WebSocketTransport({
				url: "wss://test.example.com",
				timeout: 60000,
				protocols: ["graphql-ws"],
				reconnect: {
					maxAttempts: 5,
					delay: 500,
					maxDelay: 10000,
					multiplier: 1.5,
				},
				keepAlive: 30000,
			});
			expect(Layer.isLayer(layer)).toBe(true);
		});

		it("accepts boolean reconnect option", () => {
			const layerEnabled = WebSocketTransport({
				url: "wss://test.example.com",
				reconnect: true,
			});
			const layerDisabled = WebSocketTransport({
				url: "wss://test.example.com",
				reconnect: false,
			});
			expect(Layer.isLayer(layerEnabled)).toBe(true);
			expect(Layer.isLayer(layerDisabled)).toBe(true);
		});
	});

	describe("WebSocketConstructorGlobal", () => {
		it("exports WebSocketConstructorGlobal layer", () => {
			expect(Layer.isLayer(WebSocketConstructorGlobal)).toBe(true);
		});
	});

	describe("WebSocket not connected error (code -32603)", () => {
		it("fails with -32603 when disconnected and reconnect disabled", async () => {
			const { MockWebSocket, sockets } = makeMockWebSocket();
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				yield* Effect.sleep(10);
				if (sockets[0]) {
					sockets[0].close();
				}
				yield* Effect.sleep(10);

				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error).toBeInstanceOf(TransportError);
				expect(exit.cause.error.input.code).toBe(-32603);
			}
		});
	});

	describe("Request timeout error handling", () => {
		it("fails with timeout when no response received", async () => {
			const { MockWebSocket } = makeMockWebSocket();
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", timeout: 50, reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error).toBeInstanceOf(TransportError);
				expect(exit.cause.error.message).toContain("timeout");
			}
		});
	});

	describe("Response error propagation from JSON-RPC error", () => {
		it("propagates error code, message, and data from JSON-RPC response", async () => {
			const { MockWebSocket } = makeMockWebSocket({
				onSend: (socket, data) => {
					const req = JSON.parse(String(data));
					queueMicrotask(() => {
						socket.emitMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: req.id,
								error: {
									code: -32602,
									message: "Invalid params",
									data: { hint: "bad address" },
								},
							}),
						);
					});
				},
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_getBalance", ["0x123"]);
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error).toBeInstanceOf(TransportError);
				expect(exit.cause.error.input.code).toBe(-32602);
				expect(exit.cause.error.message).toBe("Invalid params");
				expect(exit.cause.error.data).toEqual({ hint: "bad address" });
			}
		});
	});

	describe("Request/response correlation via ID matching", () => {
		it("matches responses to requests by ID (out of order)", async () => {
			const pendingRequests: Array<{ id: number; method: string }> = [];
			const { MockWebSocket, sockets } = makeMockWebSocket({
				onSend: (_socket, data) => {
					const req = JSON.parse(String(data));
					pendingRequests.push({ id: req.id, method: req.method });
				},
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				const fiber1 = yield* Effect.fork(transport.request<string>("eth_blockNumber"));
				const fiber2 = yield* Effect.fork(transport.request<string>("eth_chainId"));

				yield* Effect.sleep(20);

				if (sockets[0] && pendingRequests.length >= 2) {
					const req1 = pendingRequests.find((r) => r.method === "eth_blockNumber")!;
					const req2 = pendingRequests.find((r) => r.method === "eth_chainId")!;

					sockets[0].emitMessage(
						JSON.stringify({ jsonrpc: "2.0", id: req2.id, result: "0x1" }),
					);
					sockets[0].emitMessage(
						JSON.stringify({ jsonrpc: "2.0", id: req1.id, result: "0xabc" }),
					);
				}

				const [result1, result2] = yield* Effect.all([
					Fiber.join(fiber1),
					Fiber.join(fiber2),
				]);
				return { result1, result2 };
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const { result1, result2 } = await Effect.runPromise(program);

			expect(result1).toBe("0xabc");
			expect(result2).toBe("0x1");
		});

		it("ignores responses with unknown IDs", async () => {
			let capturedId: number | null = null;
			const { MockWebSocket, sockets } = makeMockWebSocket({
				onSend: (_socket, data) => {
					capturedId = JSON.parse(String(data)).id;
				},
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				const fiber = yield* Effect.fork(transport.request<string>("eth_blockNumber"));

				yield* Effect.sleep(20);

				if (sockets[0] && capturedId !== null) {
					sockets[0].emitMessage(
						JSON.stringify({ jsonrpc: "2.0", id: 99999, result: "0xwrong" }),
					);
					sockets[0].emitMessage(
						JSON.stringify({ jsonrpc: "2.0", id: capturedId, result: "0xcorrect" }),
					);
				}

				return yield* Fiber.join(fiber);
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xcorrect");
		});
	});

	describe("Reconnect behavior", () => {
		it("queues requests during reconnection when enabled", async () => {
			const { MockWebSocket } = makeMockWebSocket({
				onSend: (socket, data) => {
					const req = JSON.parse(String(data));
					if (req.method === "web3_clientVersion") return;
					queueMicrotask(() => {
						socket.emitMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: req.id,
								result: `0x${socket.index + 1}`,
							}),
						);
					});
				},
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({
							url: "ws://test",
							reconnect: { maxAttempts: 3, delay: 10 },
						}),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
		});

		it("fails immediately when not connected and reconnect disabled", async () => {
			const { MockWebSocket, sockets } = makeMockWebSocket();
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				yield* Effect.sleep(10);
				if (sockets[0]) {
					sockets[0].close();
				}
				yield* Effect.sleep(10);

				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error).toBeInstanceOf(TransportError);
				expect(exit.cause.error.input.code).toBe(-32603);
				expect(exit.cause.error.message).toBe("WebSocket not connected");
			}
		});

		it("fails after max reconnection attempts exceeded", async () => {
			const { MockWebSocket, sockets } = makeMockWebSocket({
				autoOpen: false,
				readyState: 0,
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;

				yield* Effect.sleep(5);
				sockets[0]?.emitError(new Error("Connection refused"));
				yield* Effect.sleep(20);
				sockets[1]?.emitError(new Error("Connection refused"));
				yield* Effect.sleep(20);
				sockets[2]?.emitError(new Error("Connection refused"));

				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({
							url: "ws://test",
							timeout: 100,
							reconnect: { maxAttempts: 2, delay: 10 },
						}),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);

			expect(exit._tag).toBe("Failure");
		});
	});

	describe("JSON-RPC error response handling", () => {
		it("handles execution reverted with data", async () => {
			const { MockWebSocket } = makeMockWebSocket({
				onSend: (socket, data) => {
					const req = JSON.parse(String(data));
					queueMicrotask(() => {
						socket.emitMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: req.id,
								error: {
									code: -32000,
									message: "execution reverted",
									data: "0x08c379a0...",
								},
							}),
						);
					});
				},
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_call", [{ to: "0x123" }]);
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error.input.code).toBe(-32000);
				expect(exit.cause.error.message).toBe("execution reverted");
				expect(exit.cause.error.data).toBe("0x08c379a0...");
			}
		});
	});

	describe("Successful request/response flow", () => {
		it("sends request and receives response", async () => {
			const { MockWebSocket } = makeMockWebSocket({
				onSend: (socket, data) => {
					const req = JSON.parse(String(data));
					expect(req.method).toBe("eth_blockNumber");
					expect(req.jsonrpc).toBe("2.0");
					expect(typeof req.id).toBe("number");
					queueMicrotask(() => {
						socket.emitMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: req.id,
								result: "0x123abc",
							}),
						);
					});
				},
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x123abc");
		});
	});

	describe("Connection failure on initial connect", () => {
		it("fails when connection is refused", async () => {
			const { MockWebSocket, sockets } = makeMockWebSocket({
				autoOpen: false,
				readyState: 0,
			});
			globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				yield* Effect.sleep(5);
				sockets[0]?.emitError(new Error("Connection refused"));
				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(
				Effect.provide(
					Layer.provide(
						WebSocketTransport({ url: "ws://test", timeout: 50, reconnect: false }),
						WebSocketConstructorGlobal,
					),
				),
				Effect.scoped,
			);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});
	});
});
