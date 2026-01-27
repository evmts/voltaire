/**
 * @fileoverview IPC transport implementation for local Ethereum node connections.
 *
 * @module IpcTransport
 * @since 0.0.1
 *
 * @description
 * Provides an IPC (Inter-Process Communication) transport layer for communicating
 * with local Ethereum nodes via Unix domain sockets or Windows named pipes.
 *
 * Features:
 * - Low latency for local node connections
 * - No network overhead
 * - Persistent connection with request correlation
 * - Automatic cleanup when scope closes
 * - Optional automatic reconnection with exponential backoff
 *
 * Use IPC transport when:
 * - Running a local Ethereum node (Geth, Nethermind, etc.)
 * - Need lowest possible latency
 * - Want to avoid network stack overhead
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link HttpTransport} - Alternative for remote nodes
 * @see {@link WebSocketTransport} - Alternative for remote subscriptions
 */

import * as FileSystem from "@effect/platform/FileSystem";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as FiberRef from "effect/FiberRef";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import { timeoutRef, tracingRef } from "./config.js";
import { nextId } from "./IdGenerator.js";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

/**
 * Reconnection options for IPC transport.
 *
 * @since 0.0.1
 */
export interface IpcReconnectOptions {
	/** Max reconnection attempts (default: 10) */
	maxAttempts?: number;
	/** Initial delay in ms (default: 1000) */
	delay?: number;
	/** Max delay in ms (default: 30000) */
	maxDelay?: number;
	/** Multiplier for exponential backoff (default: 2) */
	multiplier?: number;
}

/**
 * Configuration options for IPC transport.
 *
 * @since 0.0.1
 */
export interface IpcTransportConfig {
	/** Path to the IPC socket (e.g., ~/.ethereum/geth.ipc) */
	path: string;
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Auto-reconnect on disconnect */
	reconnect?: boolean | IpcReconnectOptions;
	/**
	 * Custom socket factory for tests.
	 * @internal
	 */
	socketFactory?: (path: string) => Effect.Effect<IpcSocket, TransportError>;
}

/**
 * JSON-RPC response structure.
 */
interface JsonRpcResponse<T> {
	jsonrpc: string;
	id: number | string;
	result?: T;
	error?: { code: number; message: string; data?: unknown };
}

/**
 * Low-level IPC socket shape.
 * @internal
 */
export interface IpcSocket {
	on(event: "data", listener: (data: Uint8Array | string) => void): this;
	on(event: "error", listener: (err: Error) => void): this;
	on(event: "close", listener: () => void): this;
	off(event: "data", listener: (data: Uint8Array | string) => void): this;
	off(event: "error", listener: (err: Error) => void): this;
	off(event: "close", listener: () => void): this;
	write(
		chunk: string | Uint8Array,
		callback?: (err?: Error | null) => void,
	): boolean;
	end(callback?: () => void): void;
}

interface QueuedRequest {
	id: number;
	method: string;
	params: unknown[];
	deferred: Deferred.Deferred<JsonRpcResponse<unknown>, never>;
}

const DEFAULT_RECONNECT_OPTIONS: Required<IpcReconnectOptions> = {
	maxAttempts: 10,
	delay: 1000,
	maxDelay: 30000,
	multiplier: 2,
};

const isWindowsPipePath = (path: string) =>
	path.startsWith("\\\\.\\pipe\\") ||
	path.startsWith("//./pipe/") ||
	path.startsWith("\\\\?\\pipe\\");

const toTransportError = (e: unknown, context: string) =>
	e instanceof TransportError
		? e
		: new TransportError(
				{
					code: -32603,
					message: `${context}: ${e instanceof Error ? e.message : String(e)}`,
				},
				undefined,
				{ cause: e instanceof Error ? e : undefined },
			);

const makeReconnectSchedule = (options: Required<IpcReconnectOptions>) =>
	Schedule.exponential(Duration.millis(options.delay), options.multiplier).pipe(
		Schedule.modifyDelay((_output, delay) =>
			Duration.min(delay, Duration.millis(options.maxDelay)),
		),
		Schedule.intersect(Schedule.recurs(options.maxAttempts)),
	);

/**
 * Creates an IPC transport layer for local node communication.
 *
 * @description
 * Provides an IPC-based implementation of the TransportService.
 * Connects to a local Ethereum node via Unix domain socket or Windows named pipe.
 *
 * The transport:
 * - Establishes socket connection on layer creation
 * - Correlates responses to requests via ID
 * - Handles pending request cleanup on connection close
 * - Automatically closes connection when scope ends
 * - Optionally reconnects with exponential backoff
 *
 * @param options - Path string or configuration object
 * @returns Scoped Layer providing TransportService
 *
 * @throws {TransportError} When socket connection fails
 * @throws {TransportError} When request times out
 * @throws {TransportError} When connection closes unexpectedly
 *
 * @since 0.0.1
 *
 * @example Simple path configuration
 * ```typescript
 * import { Effect } from 'effect'
 * import { IpcTransport, TransportService } from 'voltaire-effect/services'
 * import { NodeFileSystem } from '@effect/platform-node'
 *
 * const transport = IpcTransport('/home/user/.ethereum/geth.ipc')
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.provide(NodeFileSystem.layer),
 *   Effect.scoped
 * )
 * ```
 *
 * @example Full configuration
 * ```typescript
 * import { Effect } from 'effect'
 * import { IpcTransport, TransportService } from 'voltaire-effect/services'
 * import { NodeFileSystem } from '@effect/platform-node'
 *
 * const transport = IpcTransport({
 *   path: '/var/run/ethereum/geth.ipc',
 *   timeout: 60000,
 *   reconnect: { maxAttempts: 5, delay: 1000 }
 * })
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.provide(NodeFileSystem.layer),
 *   Effect.scoped
 * )
 * ```
 */
export const IpcTransport = (
	options: IpcTransportConfig | string,
): Layer.Layer<TransportService, TransportError, FileSystem.FileSystem> => {
	const config: IpcTransportConfig =
		typeof options === "string"
			? { path: options, timeout: 30000, reconnect: false }
			: {
					path: options.path,
					timeout: options.timeout ?? 30000,
					reconnect: options.reconnect ?? false,
					socketFactory: options.socketFactory,
				};

	const reconnectEnabled = config.reconnect !== false;
	const reconnectOptions: Required<IpcReconnectOptions> =
		typeof config.reconnect === "object"
			? { ...DEFAULT_RECONNECT_OPTIONS, ...config.reconnect }
			: DEFAULT_RECONNECT_OPTIONS;

	const reconnectSchedule = makeReconnectSchedule(reconnectOptions);

	return Layer.scoped(
		TransportService,
		Effect.gen(function* () {
			const pendingRef = yield* Ref.make<
				Map<number | string, Deferred.Deferred<JsonRpcResponse<unknown>, never>>
			>(new Map());
			const bufferRef = yield* Ref.make("");
			const writerRef = yield* Ref.make<
				((message: string) => Effect.Effect<void, TransportError>) | null
			>(null);
			const socketRef = yield* Ref.make<IpcSocket | null>(null);
			const isReconnectingRef = yield* Ref.make(false);
			const queueRef = yield* Ref.make<QueuedRequest[]>([]);
			const isClosedRef = yield* Ref.make(false);
			const connectionFiberRef = yield* Ref.make<Fiber.Fiber<
				void,
				never
			> | null>(null);

			const processMessage = (data: string | Uint8Array) =>
				Effect.gen(function* () {
					const text =
						typeof data === "string" ? data : new TextDecoder().decode(data);

					const currentBuffer = yield* Ref.get(bufferRef);
					const fullBuffer = currentBuffer + text;
					const lines = fullBuffer.split(/\r?\n/);
					const incomplete = lines.pop() ?? "";
					yield* Ref.set(bufferRef, incomplete);

					for (const line of lines) {
						if (!line.trim()) continue;
						let message: JsonRpcResponse<unknown>;
						try {
							message = JSON.parse(line) as JsonRpcResponse<unknown>;
						} catch {
							continue;
						}

						let foundDeferred:
							| Deferred.Deferred<JsonRpcResponse<unknown>, never>
							| undefined;
						yield* Ref.update(pendingRef, (pending) => {
							foundDeferred = pending.get(message.id);
							if (foundDeferred) {
								const newPending = new Map(pending);
								newPending.delete(message.id);
								return newPending;
							}
							return pending;
						});

						if (foundDeferred) {
							yield* Deferred.succeed(foundDeferred, message);
						}
					}
				});

			const failAllPending = (error: TransportError) =>
				Effect.gen(function* () {
					const pending = yield* Ref.getAndSet(pendingRef, new Map());
					const queue = yield* Ref.getAndSet(queueRef, []);

					for (const [id, deferred] of pending) {
						yield* Deferred.succeed(deferred, {
							jsonrpc: "2.0",
							id,
							error: { code: error.code, message: error.message },
						});
					}

					for (const item of queue) {
						yield* Deferred.succeed(item.deferred, {
							jsonrpc: "2.0",
							id: item.id,
							error: { code: error.code, message: error.message },
						});
					}
				});

			const createWriter = (socket: IpcSocket) => (message: string) =>
				Effect.async<void, TransportError>((resume) => {
					try {
						socket.write(`${message}\n`, (err) => {
							if (err) {
								resume(
									Effect.fail(
										toTransportError(err, "Failed to send IPC message"),
									),
								);
							} else {
								resume(Effect.succeed(undefined));
							}
						});
					} catch (e) {
						resume(
							Effect.fail(toTransportError(e, "Failed to send IPC message")),
						);
					}
				});

			const flushQueue = Effect.gen(function* () {
				const writer = yield* Ref.get(writerRef);
				if (!writer) return;

				const queue = yield* Ref.getAndSet(queueRef, []);
				for (const item of queue) {
					const request = JSON.stringify({
						jsonrpc: "2.0",
						id: item.id,
						method: item.method,
						params: item.params,
					});

					yield* Ref.update(pendingRef, (pending) => {
						const newPending = new Map(pending);
						newPending.set(item.id, item.deferred);
						return newPending;
					});

					yield* writer(request).pipe(Effect.ignore);
				}
			});

			const ensureSocketPath = Effect.gen(function* () {
				if (config.socketFactory) return;
				if (isWindowsPipePath(config.path)) return;

				const fs = yield* FileSystem.FileSystem;
				const info = yield* fs
					.stat(config.path)
					.pipe(
						Effect.mapError((e) =>
							toTransportError(e, `IPC socket not found at ${config.path}`),
						),
					);

				if (info.type !== "Socket") {
					return yield* Effect.fail(
						new TransportError({
							code: -32603,
							message: `IPC path is not a socket: ${config.path}`,
						}),
					);
				}
			});

			const connectSocket = (
				path: string,
			): Effect.Effect<IpcSocket, TransportError> =>
				Effect.tryPromise({
					try: async () => {
						const net = await import("node:net");
						return await new Promise<IpcSocket>((resolve, reject) => {
							const client = net.createConnection(path);
							const onError = (err: Error) => {
								client.off("connect", onConnect);
								reject(err);
							};
							const onConnect = () => {
								client.off("error", onError);
								resolve(client as unknown as IpcSocket);
							};
							client.once("error", onError);
							client.once("connect", onConnect);
						});
					},
					catch: (e) =>
						toTransportError(e, `Failed to connect to IPC socket at ${path}`),
				});

			const socketFactory =
				config.socketFactory ?? ((path: string) => connectSocket(path));

			const connectOnce = Effect.gen(function* () {
				const closed = yield* Ref.get(isClosedRef);
				if (closed) {
					return yield* Effect.fail(
						new TransportError({
							code: -32603,
							message: "IPC transport is closed",
						}),
					);
				}

				yield* ensureSocketPath;

				const socket = yield* socketFactory(config.path);
				yield* Ref.set(socketRef, socket);
				yield* Ref.set(bufferRef, "");
				yield* Ref.set(writerRef, createWriter(socket));
				return socket;
			});

			const waitForSocketClose = (socket: IpcSocket) =>
				Effect.async<void, TransportError>((resume) => {
					let done = false;

					const onData = (data: Uint8Array | string) => {
						Effect.runFork(processMessage(data));
					};

					const onClose = () => {
						if (done) return;
						done = true;
						resume(
							Effect.fail(
								new TransportError({
									code: -32603,
									message: "IPC socket closed",
								}),
							),
						);
					};

					const onError = (err: Error) => {
						if (done) return;
						done = true;
						resume(Effect.fail(toTransportError(err, "IPC socket error")));
					};

					socket.on("data", onData);
					socket.on("close", onClose);
					socket.on("error", onError);

					return Effect.sync(() => {
						socket.off("data", onData);
						socket.off("close", onClose);
						socket.off("error", onError);
					});
				});

			const reconnectDriver = reconnectEnabled
				? yield* Schedule.driver(reconnectSchedule)
				: null;

			const nextReconnectDelay = reconnectDriver
				? reconnectDriver.next(undefined).pipe(
						Effect.match({
							onFailure: () => Option.none(),
							onSuccess: (delay) => Option.some(delay),
						}),
					)
				: Effect.succeed(Option.none());

			const connectionLoop = Effect.gen(function* () {
				while (true) {
					const closed = yield* Ref.get(isClosedRef);
					if (closed) return;

					const connection = yield* Effect.either(connectOnce);
					if (connection._tag === "Left") {
						if (!reconnectEnabled) {
							yield* failAllPending(connection.left);
							return;
						}

						yield* Ref.set(isReconnectingRef, true);
						const delay = yield* nextReconnectDelay;
						if (Option.isNone(delay)) {
							yield* failAllPending(
								new TransportError({
									code: -32603,
									message: `IPC reconnection failed after ${reconnectOptions.maxAttempts} attempts`,
								}),
							);
							return;
						}

						yield* Effect.sleep(delay.value[0]);
						continue;
					}

					if (reconnectDriver) {
						yield* reconnectDriver.reset;
					}

					yield* Ref.set(isReconnectingRef, false);
					yield* flushQueue;

					const socket = connection.right;
					const closeExit = yield* waitForSocketClose(socket).pipe(
						Effect.either,
					);

					yield* Ref.set(writerRef, null);
					yield* Ref.set(socketRef, null);

					const nowClosed = yield* Ref.get(isClosedRef);
					if (nowClosed) return;

					const closeError =
						closeExit._tag === "Left"
							? closeExit.left
							: new TransportError({
									code: -32603,
									message: "IPC socket closed",
								});

					if (!reconnectEnabled) {
						yield* failAllPending(closeError);
						return;
					}

					yield* Ref.set(isReconnectingRef, true);
					const delay = yield* nextReconnectDelay;
					if (Option.isNone(delay)) {
						yield* failAllPending(
							new TransportError({
								code: -32603,
								message: `IPC reconnection failed after ${reconnectOptions.maxAttempts} attempts`,
							}),
						);
						return;
					}

					yield* Effect.sleep(delay.value[0]);
				}
			});

			const connectionFiber = yield* Effect.fork(
				connectionLoop.pipe(Effect.ignore),
			);
			yield* Ref.set(connectionFiberRef, connectionFiber);

			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Ref.set(isClosedRef, true);

					const socket = yield* Ref.get(socketRef);
					if (socket) {
						try {
							socket.end();
						} catch {
							// ignore
						}
					}

					const fiber = yield* Ref.get(connectionFiberRef);
					if (fiber) {
						yield* Fiber.interrupt(fiber);
					}

					yield* failAllPending(
						new TransportError({
							code: -32603,
							message: "IPC transport closed",
						}),
					);
				}),
			);

			const awaitResponse = <T>(
				deferred: Deferred.Deferred<JsonRpcResponse<T>, never>,
				onTimeout: Effect.Effect<void>,
				timeout: Duration.Duration,
			) =>
				Deferred.await(deferred).pipe(
					Effect.timeout(timeout),
					Effect.catchTag("TimeoutException", () =>
						Effect.gen(function* () {
							yield* onTimeout;
							return yield* Effect.fail(
								new TransportError({
									code: -32603,
									message: `Request timeout after ${Duration.toMillis(timeout)}ms`,
								}),
							);
						}),
					),
				);

			return {
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						const timeoutOverride = yield* FiberRef.get(timeoutRef);
						const tracingEnabled = yield* FiberRef.get(tracingRef);
						const timeout =
							timeoutOverride ?? Duration.millis(config.timeout ?? 30000);
						const closed = yield* Ref.get(isClosedRef);
						if (closed) {
							return yield* Effect.fail(
								new TransportError({
									code: -32603,
									message: "IPC transport is closed",
								}),
							);
						}

						const id = yield* nextId;
						const deferred = yield* Deferred.make<JsonRpcResponse<T>, never>();
						const writer = yield* Ref.get(writerRef);
						const isReconnecting = yield* Ref.get(isReconnectingRef);

						if (tracingEnabled) {
							yield* Effect.logDebug(`rpc ${method} -> ipc:${config.path}`);
						}

						if (!writer || isReconnecting) {
							if (!reconnectEnabled) {
								return yield* Effect.fail(
									new TransportError({
										code: -32603,
										message: "IPC not connected",
									}),
								);
							}

							yield* Ref.update(queueRef, (queue) => [
								...queue,
								{
									id,
									method,
									params,
									deferred: deferred as Deferred.Deferred<
										JsonRpcResponse<unknown>,
										never
									>,
								},
							]);

							const response = yield* awaitResponse(
								deferred,
								Effect.all(
									[
										Ref.update(queueRef, (q) =>
											q.filter((item) => item.id !== id),
										),
										Ref.update(pendingRef, (pending) => {
											const next = new Map(pending);
											next.delete(id);
											return next;
										}),
									],
									{ discard: true },
								),
								timeout,
							);

							if (response.error) {
								return yield* Effect.fail(
									new TransportError({
										code: response.error.code,
										message: response.error.message,
										data: response.error.data,
									}),
								);
							}

							return response.result as T;
						}

						yield* Ref.update(pendingRef, (pending) => {
							const next = new Map(pending);
							next.set(
								id,
								deferred as Deferred.Deferred<JsonRpcResponse<unknown>, never>,
							);
							return next;
						});

						const request = JSON.stringify({
							jsonrpc: "2.0",
							id,
							method,
							params,
						});

						yield* writer(request).pipe(
							Effect.tapError(() =>
								Ref.update(pendingRef, (pending) => {
									const next = new Map(pending);
									next.delete(id);
									return next;
								}),
							),
						);

						const response = yield* awaitResponse(
							deferred,
							Ref.update(pendingRef, (pending) => {
								const next = new Map(pending);
								next.delete(id);
								return next;
							}),
							timeout,
						);

						if (response.error) {
							return yield* Effect.fail(
								new TransportError({
									code: response.error.code,
									message: response.error.message,
									data: response.error.data,
								}),
							);
						}

						return response.result as T;
					}),
			};
		}),
	);
};
