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
 */

import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";

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
 * Creates a batch scheduler that queues requests and sends them together.
 *
 * @param send - Function to send a batch of requests
 * @param options - Batch configuration
 * @returns Object with schedule function for adding requests
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const scheduler = createBatchScheduler(
 *   (requests) => sendBatchRequest(url, requests),
 *   { batchSize: 50, wait: 10 }
 * );
 *
 * const result = await Effect.runPromise(scheduler.schedule('eth_blockNumber'));
 * ```
 */
export const createBatchScheduler = (
	send: (
		requests: JsonRpcRequest[],
	) => Effect.Effect<JsonRpcBatchResponse[], Error>,
	options: BatchOptions = {},
) => {
	const batchSize = options.batchSize ?? 100;
	const wait = options.wait ?? 0;

	let pending: PendingRequest[] = [];
	let flushTimer: ReturnType<typeof setTimeout> | null = null;
	let nextId = 1;

	const flush = async (): Promise<void> => {
		flushTimer = null;
		
		while (pending.length > 0) {
			const batch = pending.splice(0, batchSize);
			if (batch.length === 0) return;

			const requests = batch.map((p) => ({
				id: p.id,
				method: p.method,
				params: p.params,
			}));

			try {
				const responses = await Effect.runPromise(send(requests));

				for (const response of responses) {
					const req = batch.find((p) => p.id === response.id);
					if (!req) continue;

					if (response.error) {
						Effect.runSync(
							Deferred.fail(req.deferred, new Error(response.error.message)),
						);
					} else {
						Effect.runSync(Deferred.succeed(req.deferred, response.result));
					}
				}
			} catch (e) {
				const error = e instanceof Error ? e : new Error(String(e));
				for (const p of batch) {
					Effect.runSync(Deferred.fail(p.deferred, error));
				}
			}
		}
	};

	const scheduleFlush = (): void => {
		if (pending.length >= batchSize) {
			if (flushTimer) {
				clearTimeout(flushTimer);
				flushTimer = null;
			}
			flush();
			return;
		}

		if (!flushTimer) {
			flushTimer = setTimeout(() => flush(), wait);
		}
	};

	return {
		schedule: <T>(
			method: string,
			params?: unknown[],
		): Effect.Effect<T, Error> =>
			Effect.gen(function* () {
				const id = nextId++;
				const deferred = yield* Deferred.make<unknown, Error>();

				pending.push({ id, method, params, deferred });
				scheduleFlush();

				return (yield* Deferred.await(deferred)) as T;
			}),
	};
};
