/**
 * @fileoverview Batch scheduler for JSON-RPC requests.
 *
 * @module BatchScheduler
 * @since 0.0.1
 *
 * @description
 * Provides request batching to combine multiple JSON-RPC requests into a single
 * HTTP call. Reduces network overhead and improves performance when making
 * many concurrent requests.
 *
 * Uses Effect patterns for proper structured concurrency - no Effect.runSync
 * or Effect.runPromise escape hatches.
 */

import * as Chunk from "effect/Chunk";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Option from "effect/Option";
import * as Queue from "effect/Queue";
import * as Ref from "effect/Ref";
import type * as Scope from "effect/Scope";

/**
 * Configuration options for batch scheduling.
 *
 * @since 0.0.1
 */
export interface BatchOptions {
	/** Maximum requests per batch (default: 100) */
	batchSize?: number;
	/** Wait time in ms before flushing batch (default: 0 - immediate microtask) */
	wait?: number;
}

/**
 * JSON-RPC request structure.
 */
interface JsonRpcRequest {
	id: number;
	method: string;
	params?: unknown[];
}

/**
 * JSON-RPC batch response structure.
 */
interface JsonRpcBatchResponse {
	id: number;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
}

/**
 * Pending request with deferred for completion.
 */
interface PendingRequest {
	id: number;
	method: string;
	params?: unknown[];
	deferred: Deferred.Deferred<unknown, Error>;
}

/**
 * Batch scheduler interface.
 */
export interface BatchScheduler {
	schedule: <T>(method: string, params?: unknown[]) => Effect.Effect<T, Error>;
}

/**
 * Creates a batch scheduler that queues requests and sends them together.
 *
 * Uses Effect patterns for proper structured concurrency:
 * - Queue for pending requests
 * - Ref for ID counter
 * - Atomic flushing gate
 * - Proper cleanup on shutdown/interruption
 *
 * @param send - Function to send a batch of requests
 * @param options - Batch configuration
 * @returns Scoped Effect that produces a BatchScheduler
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const scheduler = yield* createBatchScheduler(
 *     (requests) => sendBatchRequest(url, requests),
 *     { batchSize: 50, wait: 10 }
 *   );
 *
 *   const result = yield* scheduler.schedule('eth_blockNumber');
 *   return result;
 * }).pipe(Effect.scoped);
 * ```
 */
export const createBatchScheduler = <E extends Error>(
	send: (requests: JsonRpcRequest[]) => Effect.Effect<JsonRpcBatchResponse[], E>,
	options: BatchOptions = {},
): Effect.Effect<BatchScheduler, never, Scope.Scope> =>
	Effect.gen(function* () {
		const batchSize = options.batchSize ?? 100;
		const wait = options.wait ?? 0;

		const pendingQueue = yield* Queue.unbounded<PendingRequest>();
		const idRef = yield* Ref.make(1);
		const flushingRef = yield* Ref.make(false);
		const flushFiberRef = yield* Ref.make<Option.Option<Fiber.RuntimeFiber<void, never>>>(Option.none());

		const failBatch = (batch: readonly PendingRequest[], error: Error): Effect.Effect<void> =>
			Effect.forEach(batch, (req) => Deferred.fail(req.deferred, error), { discard: true });

		const completeBatch = (
			batch: readonly PendingRequest[],
			responses: readonly JsonRpcBatchResponse[],
		): Effect.Effect<void> =>
			Effect.gen(function* () {
				const byId = new Map(batch.map((r) => [r.id, r] as const));
				const completed = new Set<number>();

				for (const resp of responses) {
					const req = byId.get(resp.id);
					if (!req) continue;
					completed.add(resp.id);
					if (resp.error) {
						yield* Deferred.fail(req.deferred, new Error(resp.error.message));
					} else {
						yield* Deferred.succeed(req.deferred, resp.result);
					}
				}

				for (const req of batch) {
					if (!completed.has(req.id)) {
						yield* Deferred.fail(
							req.deferred,
							new Error(`Missing JSON-RPC response for id ${req.id}`),
						);
					}
				}
			});

		const processBatch = (batch: readonly PendingRequest[]): Effect.Effect<void> =>
			Effect.uninterruptibleMask((restore) =>
				Effect.gen(function* () {
					const requests = batch.map((p) => ({
						id: p.id,
						method: p.method,
						params: p.params,
					}));

					const result = yield* restore(send(requests)).pipe(
						Effect.either,
					);

					if (result._tag === "Left") {
						const error =
							result.left instanceof Error
								? result.left
								: new Error(String(result.left));
						yield* failBatch(batch, error);
					} else {
						yield* completeBatch(batch, result.right);
					}
				}).pipe(
					Effect.onInterrupt(() => failBatch(batch, new Error("Batch send interrupted"))),
				),
			);

		const flush: Effect.Effect<void> = Effect.gen(function* () {
			const acquired = yield* Ref.modify(flushingRef, (b) =>
				b ? [false, true] as const : [true, true] as const,
			);
			if (!acquired) return;

			try {
				let pending = yield* Queue.takeAll(pendingQueue);

				while (!Chunk.isEmpty(pending)) {
					const pendingArray = Chunk.toReadonlyArray(pending);
					const [batchArray, overflowArray] = [
						pendingArray.slice(0, batchSize),
						pendingArray.slice(batchSize),
					];

					for (const req of overflowArray) {
						yield* Queue.offer(pendingQueue, req);
					}

					yield* processBatch(batchArray);

					pending = yield* Queue.takeAll(pendingQueue);
				}
			} finally {
				yield* Ref.set(flushingRef, false);
			}
		});

		const scheduleFlush: Effect.Effect<void> = Effect.gen(function* () {
			const size = yield* Queue.size(pendingQueue);
			if (size > 0) {
				if (wait > 0) {
					yield* Effect.sleep(wait);
				} else {
					yield* Effect.yieldNow();
				}
				yield* flush;
			}
		});

		const triggerFlush: Effect.Effect<void> = Effect.gen(function* () {
			const size = yield* Queue.size(pendingQueue);

			if (size >= batchSize) {
				yield* Ref.modify(flushFiberRef, (opt) => {
					if (Option.isSome(opt)) {
						Effect.runFork(Fiber.interrupt(opt.value));
					}
					return [undefined, Option.none()] as const;
				});
				yield* flush;
			} else {
				const currentFiber = yield* Ref.get(flushFiberRef);
				if (Option.isNone(currentFiber)) {
					const fiber = yield* Effect.fork(scheduleFlush);
					yield* Ref.set(flushFiberRef, Option.some(fiber));
				}
			}
		});

		yield* Effect.addFinalizer(() =>
			Effect.gen(function* () {
				const remaining = yield* Queue.takeAll(pendingQueue);
				yield* Queue.shutdown(pendingQueue);

				for (const req of Chunk.toReadonlyArray(remaining)) {
					yield* Deferred.fail(req.deferred, new Error("BatchScheduler shutdown"));
				}

				const fiber = yield* Ref.get(flushFiberRef);
				if (Option.isSome(fiber)) {
					yield* Fiber.interrupt(fiber.value);
				}
			}),
		);

		return {
			schedule: <T>(method: string, params?: unknown[]): Effect.Effect<T, Error> =>
				Effect.gen(function* () {
					const id = yield* Ref.getAndUpdate(idRef, (n) => n + 1);
					const deferred = yield* Deferred.make<unknown, Error>();

					const offered = yield* Queue.offer(pendingQueue, { id, method, params, deferred }).pipe(
						Effect.either,
					);

					if (offered._tag === "Left") {
						return yield* Effect.fail(new Error("BatchScheduler is shutdown"));
					}

					yield* triggerFlush;

					return (yield* Deferred.await(deferred)) as T;
				}),
		};
	});
