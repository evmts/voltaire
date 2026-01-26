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

import * as Socket from "@effect/platform/Socket";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Queue from "effect/Queue";
import * as Ref from "effect/Ref";
import * as Scope from "effect/Scope";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

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
 * Creates an IPC transport layer for local node communication.
 *
 * @description
 * Provides an IPC-based implementation of the TransportService.
 * Connects to a local Ethereum node via Unix domain socket.
 *
 * The transport:
 * - Establishes socket connection on layer creation
 * - Correlates responses to requests via ID
 * - Handles pending request cleanup on connection close
 * - Automatically closes connection when scope ends
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
 *
 * const transport = IpcTransport('/home/user/.ethereum/geth.ipc')
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.scoped
 * )
 * ```
 *
 * @example Full configuration
 * ```typescript
 * import { Effect } from 'effect'
 * import { IpcTransport, TransportService } from 'voltaire-effect/services'
 *
 * const transport = IpcTransport({
 *   path: '/var/run/ethereum/geth.ipc',
 *   timeout: 60000
 * })
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.provide(transport),
 *   Effect.scoped
 * )
 * ```
 */
export const IpcTransport = (
	options: IpcTransportConfig | string,
): Layer.Layer<TransportService, TransportError> => {
	const config =
		typeof options === "string"
			? { path: options, timeout: 30000 }
			: { path: options.path, timeout: options.timeout ?? 30000 };

	return Layer.scoped(
		TransportService,
		Effect.gen(function* () {
			const requestIdRef = yield* Ref.make(0);
			const pendingRef = yield* Ref.make<
				Map<number | string, Deferred.Deferred<JsonRpcResponse<unknown>, never>>
			>(new Map());

			// Buffer for incomplete messages (JSON-RPC can span multiple chunks)
			const bufferRef = yield* Ref.make("");

			// Message queue for outgoing requests
			const sendQueue = yield* Queue.unbounded<string>();

			const processMessage = (data: string | Uint8Array) =>
				Effect.gen(function* () {
					const text = typeof data === "string" ? data : new TextDecoder().decode(data);

					// Append to buffer
					const currentBuffer = yield* Ref.get(bufferRef);
					const fullBuffer = currentBuffer + text;

					// Try to parse complete JSON messages
					// JSON-RPC messages are newline-delimited
					const lines = fullBuffer.split("\n");
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

						let foundDeferred: Deferred.Deferred<JsonRpcResponse<unknown>, never> | undefined;
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
					for (const [id, deferred] of pending) {
						yield* Deferred.succeed(deferred, {
							jsonrpc: "2.0",
							id,
							error: { code: error.code, message: error.message },
						});
					}
				});

			// Create Unix socket connection
			const socket = yield* Effect.tryPromise({
				try: async () => {
					// Dynamic import for Node.js net module
					const net = await import("node:net");
					return new Promise<typeof net.Socket.prototype>((resolve, reject) => {
						const client = net.createConnection(config.path, () => {
							resolve(client);
						});
						client.on("error", reject);
					});
				},
				catch: (e) =>
					new TransportError({
						code: -32603,
						message: `Failed to connect to IPC socket: ${e instanceof Error ? e.message : String(e)}`,
					}),
			});

			// Set up message handling
			yield* Effect.tryPromise({
				try: async () => {
					socket.on("data", (data: Buffer) => {
						Effect.runFork(processMessage(data.toString()));
					});

					socket.on("close", () => {
						Effect.runFork(
							failAllPending(
								new TransportError({
									code: -32603,
									message: "IPC socket closed",
								}),
							),
						);
					});

					socket.on("error", (err: Error) => {
						Effect.runFork(
							failAllPending(
								new TransportError({
									code: -32603,
									message: `IPC socket error: ${err.message}`,
								}),
							),
						);
					});
				},
				catch: (e) =>
					new TransportError({
						code: -32603,
						message: `Failed to set up IPC handlers: ${e instanceof Error ? e.message : String(e)}`,
					}),
			});

			// Send messages from queue
			const sendLoop = Effect.gen(function* () {
				while (true) {
					const message = yield* Queue.take(sendQueue);
					yield* Effect.tryPromise({
						try: () =>
							new Promise<void>((resolve, reject) => {
								socket.write(message + "\n", (err: Error | null) => {
									if (err) reject(err);
									else resolve();
								});
							}),
						catch: (e) =>
							new TransportError({
								code: -32603,
								message: `Failed to send IPC message: ${e instanceof Error ? e.message : String(e)}`,
							}),
					});
				}
			}).pipe(Effect.ignore, Effect.fork);

			yield* sendLoop;

			// Cleanup on scope close
			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Queue.shutdown(sendQueue);
					yield* Effect.tryPromise({
						try: () =>
							new Promise<void>((resolve) => {
								socket.end(() => resolve());
							}),
						catch: () => void 0,
					});
					yield* failAllPending(
						new TransportError({
							code: -32603,
							message: "IPC transport closed",
						}),
					);
				}),
			);

			return {
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						const id = yield* Ref.updateAndGet(requestIdRef, (n) => n + 1);
						const deferred = yield* Deferred.make<JsonRpcResponse<T>, never>();

						yield* Ref.update(pendingRef, (pending) => {
							const newPending = new Map(pending);
							newPending.set(id, deferred as Deferred.Deferred<JsonRpcResponse<unknown>, never>);
							return newPending;
						});

						const request = JSON.stringify({
							jsonrpc: "2.0",
							id,
							method,
							params,
						});

						yield* Queue.offer(sendQueue, request);

						const response = yield* Deferred.await(deferred).pipe(
							Effect.timeout(Duration.millis(config.timeout)),
							Effect.catchTag("TimeoutException", () =>
								Effect.gen(function* () {
									yield* Ref.update(pendingRef, (p) => {
										const newPending = new Map(p);
										newPending.delete(id);
										return newPending;
									});
									return yield* Effect.fail(
										new TransportError({
											code: -32603,
											message: `Request timeout after ${config.timeout}ms`,
										}),
									);
								}),
							),
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
