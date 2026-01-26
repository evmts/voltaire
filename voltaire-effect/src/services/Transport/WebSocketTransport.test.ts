import * as Socket from "@effect/platform/Socket";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as TestClock from "effect/TestClock";
import { describe, expect, it, vi } from "@effect/vitest";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";
import { WebSocketTransport } from "./WebSocketTransport.js";

type MockWebSocketEvents = {
	open: (() => void)[];
	message: ((event: { data: string }) => void)[];
	close: ((event: { code: number; reason?: string }) => void)[];
	error: ((event: unknown) => void)[];
};

interface MockWebSocket extends EventTarget {
	readyState: number;
	send: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
	addEventListener: (type: string, listener: (event: unknown) => void) => void;
	removeEventListener: (type: string, listener: (event: unknown) => void) => void;
	_events: MockWebSocketEvents;
	_simulateOpen: () => void;
	_simulateMessage: (data: string) => void;
	_simulateClose: (code?: number, reason?: string) => void;
	_simulateError: (error: unknown) => void;
}

const createMockWebSocket = (): MockWebSocket => {
	const events: MockWebSocketEvents = {
		open: [],
		message: [],
		close: [],
		error: [],
	};

	const ws: MockWebSocket = {
		readyState: 0,
		send: vi.fn(),
		close: vi.fn(),
		addEventListener: (type: string, listener: (event: unknown) => void) => {
			if (type in events) {
				(events as Record<string, Array<(event: unknown) => void>>)[type].push(listener);
			}
		},
		removeEventListener: (type: string, listener: (event: unknown) => void) => {
			if (type in events) {
				const arr = (events as Record<string, Array<(event: unknown) => void>>)[type];
				const idx = arr.indexOf(listener);
				if (idx >= 0) arr.splice(idx, 1);
			}
		},
		dispatchEvent: () => true,
		_events: events,
		_simulateOpen: () => {
			ws.readyState = 1;
			for (const listener of events.open) listener();
		},
		_simulateMessage: (data: string) => {
			for (const listener of events.message) listener({ data });
		},
		_simulateClose: (code = 1000, reason = "") => {
			ws.readyState = 3;
			for (const listener of events.close) listener({ code, reason });
		},
		_simulateError: (error: unknown) => {
			for (const listener of events.error) listener(error);
		},
	};

	return ws;
};

const makeMockWebSocketLayer = (
	mockWsRef: { current: MockWebSocket | null },
	options?: { shouldFailConnection?: boolean; connectionDelay?: number },
): Layer.Layer<Socket.WebSocketConstructor> =>
	Layer.succeed(
		Socket.WebSocketConstructor,
		(_url: string, _protocols?: string | string[]) => {
			const ws = createMockWebSocket();
			mockWsRef.current = ws;

			if (options?.shouldFailConnection) {
				setTimeout(() => ws._simulateError(new Error("Connection failed")), 0);
			} else {
				setTimeout(() => ws._simulateOpen(), options?.connectionDelay ?? 0);
			}

			return ws as unknown as globalThis.WebSocket;
		},
	);

describe("WebSocketTransport", () => {
	describe("connection errors", () => {
		it.effect("fails with -32603 when WebSocket is not connected and reconnect disabled", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 1000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef, { connectionDelay: 50 })));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const mockWs = mockWsRef.current;
					if (mockWs) {
						mockWs._simulateClose(1006, "Connection closed");
					}

					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					return yield* t.request<string>("eth_blockNumber");
				}).pipe(Effect.provide(layer), Effect.scoped);

				const exit = yield* Effect.exit(program);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					expect(error._tag).toBe("Fail");
					if (error._tag === "Fail") {
						expect(error.error).toBeInstanceOf(TransportError);
						expect(error.error.input.code).toBe(-32603);
					}
				}
			}),
		);

		it.effect("fails when initial connection fails", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 100,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef, { shouldFailConnection: true })));

				const program = Effect.gen(function* () {
					const t = yield* TransportService;
					return yield* t.request<string>("eth_blockNumber");
				}).pipe(Effect.provide(layer), Effect.scoped);

				const exit = yield* Effect.exit(program);

				expect(Exit.isFailure(exit)).toBe(true);
			}),
		);
	});

	describe("request timeout", () => {
		it.effect("fails with timeout error when response takes too long", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 100,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef)));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					const requestFiber = yield* Effect.fork(t.request<string>("eth_blockNumber"));

					yield* TestClock.adjust(Duration.millis(150));

					return yield* Fiber.join(requestFiber);
				}).pipe(Effect.provide(layer), Effect.scoped);

				const exit = yield* Effect.exit(program);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toBeInstanceOf(TransportError);
					expect(exit.cause.error.message).toContain("timeout");
				}
			}),
		);
	});

	describe("JSON-RPC error response handling", () => {
		it.effect("propagates JSON-RPC error from response", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 5000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef)));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					const requestFiber = yield* Effect.fork(t.request<string>("eth_getBalance", ["0x123", "latest"]));

					yield* Effect.sleep(Duration.millis(10));

					const mockWs = mockWsRef.current;
					if (mockWs && mockWs.send.mock.calls.length > 0) {
						const sentRequest = JSON.parse(mockWs.send.mock.calls[0][0] as string);
						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: sentRequest.id,
								error: {
									code: -32602,
									message: "Invalid params",
									data: { details: "Invalid address format" },
								},
							}),
						);
					}

					return yield* Fiber.join(requestFiber);
				}).pipe(Effect.provide(layer), Effect.scoped);

				const exit = yield* Effect.exit(program);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toBeInstanceOf(TransportError);
					expect(exit.cause.error.input.code).toBe(-32602);
					expect(exit.cause.error.message).toBe("Invalid params");
					expect(exit.cause.error.data).toEqual({ details: "Invalid address format" });
				}
			}),
		);
	});

	describe("request/response correlation via ID matching", () => {
		it.effect("matches response to correct request by ID", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 5000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef)));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;

					const req1Fiber = yield* Effect.fork(t.request<string>("eth_blockNumber"));
					yield* Effect.sleep(Duration.millis(5));

					const req2Fiber = yield* Effect.fork(t.request<string>("eth_chainId"));
					yield* Effect.sleep(Duration.millis(10));

					const mockWs = mockWsRef.current;
					if (mockWs && mockWs.send.mock.calls.length >= 2) {
						const req1 = JSON.parse(mockWs.send.mock.calls[0][0] as string);
						const req2 = JSON.parse(mockWs.send.mock.calls[1][0] as string);

						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: req2.id,
								result: "0x1",
							}),
						);

						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: req1.id,
								result: "0x1234567",
							}),
						);
					}

					const [result1, result2] = yield* Effect.all([Fiber.join(req1Fiber), Fiber.join(req2Fiber)]);

					return { result1, result2 };
				}).pipe(Effect.provide(layer), Effect.scoped);

				const { result1, result2 } = yield* program;

				expect(result1).toBe("0x1234567");
				expect(result2).toBe("0x1");
			}),
		);

		it.effect("ignores responses with unknown IDs", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 5000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef)));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					const requestFiber = yield* Effect.fork(t.request<string>("eth_blockNumber"));

					yield* Effect.sleep(Duration.millis(10));

					const mockWs = mockWsRef.current;
					if (mockWs && mockWs.send.mock.calls.length > 0) {
						const sentRequest = JSON.parse(mockWs.send.mock.calls[0][0] as string);

						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: 99999,
								result: "0xwrongresponse",
							}),
						);

						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: sentRequest.id,
								result: "0xcorrect",
							}),
						);
					}

					return yield* Fiber.join(requestFiber);
				}).pipe(Effect.provide(layer), Effect.scoped);

				const result = yield* program;
				expect(result).toBe("0xcorrect");
			}),
		);
	});

	describe("reconnect behavior", () => {
		it.effect("queues requests during reconnection when enabled", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };
				const connectionCount = yield* Ref.make(0);

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 10000,
					reconnect: {
						maxAttempts: 3,
						delay: 100,
						maxDelay: 1000,
						multiplier: 2,
					},
				}).pipe(
					Layer.provide(
						Layer.succeed(Socket.WebSocketConstructor, (_url: string) => {
							const ws = createMockWebSocket();
							mockWsRef.current = ws;
							Effect.runSync(Ref.update(connectionCount, (n) => n + 1));
							setTimeout(() => ws._simulateOpen(), 5);
							return ws as unknown as globalThis.WebSocket;
						}),
					),
				);

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(20));

					const t = yield* TransportService;

					const result = yield* t.request<string>("eth_blockNumber");
					return result;
				}).pipe(Effect.provide(layer), Effect.scoped);

				const fiber = yield* Effect.fork(program);
				yield* Effect.sleep(Duration.millis(50));

				const mockWs = mockWsRef.current;
				if (mockWs && mockWs.send.mock.calls.length > 0) {
					const sentRequest = JSON.parse(mockWs.send.mock.calls[0][0] as string);
					mockWs._simulateMessage(
						JSON.stringify({
							jsonrpc: "2.0",
							id: sentRequest.id,
							result: "0xabc",
						}),
					);
				}

				const result = yield* Fiber.join(fiber);
				expect(result).toBe("0xabc");
			}),
		);

		it.effect("fails immediately when not connected and reconnect disabled", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 1000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef, { connectionDelay: 10 })));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(20));

					const mockWs = mockWsRef.current;
					if (mockWs) {
						mockWs._simulateClose(1006, "Abnormal closure");
					}

					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					return yield* t.request<string>("eth_blockNumber");
				}).pipe(Effect.provide(layer), Effect.scoped);

				const exit = yield* Effect.exit(program);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toBeInstanceOf(TransportError);
					expect(exit.cause.error.input.code).toBe(-32603);
					expect(exit.cause.error.message).toBe("WebSocket not connected");
				}
			}),
		);

		it.effect("fails after max reconnection attempts exceeded", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };
				let attemptCount = 0;

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 1000,
					reconnect: {
						maxAttempts: 2,
						delay: 10,
						maxDelay: 100,
						multiplier: 2,
					},
				}).pipe(
					Layer.provide(
						Layer.succeed(Socket.WebSocketConstructor, (_url: string) => {
							const ws = createMockWebSocket();
							mockWsRef.current = ws;
							attemptCount++;
							setTimeout(() => ws._simulateError(new Error("Connection refused")), 5);
							return ws as unknown as globalThis.WebSocket;
						}),
					),
				);

				const program = Effect.gen(function* () {
					const t = yield* TransportService;
					return yield* t.request<string>("eth_blockNumber");
				}).pipe(Effect.provide(layer), Effect.scoped);

				const exit = yield* Effect.exit(program);

				expect(Exit.isFailure(exit)).toBe(true);
			}),
		);
	});

	describe("successful request/response", () => {
		it.effect("returns successful response", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 5000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef)));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					const requestFiber = yield* Effect.fork(t.request<string>("eth_blockNumber"));

					yield* Effect.sleep(Duration.millis(10));

					const mockWs = mockWsRef.current;
					if (mockWs && mockWs.send.mock.calls.length > 0) {
						const sentRequest = JSON.parse(mockWs.send.mock.calls[0][0] as string);
						expect(sentRequest.method).toBe("eth_blockNumber");
						expect(sentRequest.jsonrpc).toBe("2.0");

						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: sentRequest.id,
								result: "0x123456",
							}),
						);
					}

					return yield* Fiber.join(requestFiber);
				}).pipe(Effect.provide(layer), Effect.scoped);

				const result = yield* program;
				expect(result).toBe("0x123456");
			}),
		);

		it.effect("sends params correctly", () =>
			Effect.gen(function* () {
				const mockWsRef = { current: null as MockWebSocket | null };

				const layer = WebSocketTransport({
					url: "wss://test.example.com",
					timeout: 5000,
					reconnect: false,
				}).pipe(Layer.provide(makeMockWebSocketLayer(mockWsRef)));

				const program = Effect.gen(function* () {
					yield* Effect.sleep(Duration.millis(10));

					const t = yield* TransportService;
					const requestFiber = yield* Effect.fork(
						t.request<string>("eth_getBalance", ["0xabc123", "latest"]),
					);

					yield* Effect.sleep(Duration.millis(10));

					const mockWs = mockWsRef.current;
					if (mockWs && mockWs.send.mock.calls.length > 0) {
						const sentRequest = JSON.parse(mockWs.send.mock.calls[0][0] as string);
						expect(sentRequest.method).toBe("eth_getBalance");
						expect(sentRequest.params).toEqual(["0xabc123", "latest"]);

						mockWs._simulateMessage(
							JSON.stringify({
								jsonrpc: "2.0",
								id: sentRequest.id,
								result: "0x1234",
							}),
						);
					}

					return yield* Fiber.join(requestFiber);
				}).pipe(Effect.provide(layer), Effect.scoped);

				const result = yield* program;
				expect(result).toBe("0x1234");
			}),
		);
	});
});
