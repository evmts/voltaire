/**
 * @fileoverview Fallback transport that switches between multiple transports on failure.
 *
 * @module FallbackTransport
 * @since 0.0.1
 *
 * @description
 * Provides fault-tolerant transport by automatically failing over to backup transports
 * when the primary transport fails. Supports latency-based ranking to prefer faster transports.
 *
 * Features:
 * - Automatic failover on error
 * - Latency-based ranking when rank: true
 * - Configurable retries per transport
 * - Recovery: failed transports can recover
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link HttpTransport} - Common transport to combine
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

/**
 * Configuration options for fallback transport.
 *
 * @since 0.0.1
 */
export interface FallbackTransportOptions {
	/**
	 * Rank transports based on latency.
	 * When true, faster transports are preferred.
	 * @default false
	 */
	rank?: boolean;

	/**
	 * Number of retries per transport before switching to the next.
	 * @default 3
	 */
	retryCount?: number;

	/**
	 * Delay between retries in milliseconds.
	 * @default 150
	 */
	retryDelay?: number;
}

interface TransportInstance {
	transport: Layer.Layer<TransportService>;
	failures: number;
	latency: number;
}

/**
 * Creates a fallback transport that automatically switches between transports on failure.
 *
 * @description
 * Wraps multiple transports and provides automatic failover. When a request fails,
 * the fallback transport tries the next available transport. Transports can recover
 * over time as successful requests reset their failure count.
 *
 * When `rank: true`, transports are sorted by latency after each successful request,
 * so faster transports are preferred.
 *
 * @param transports - Array of transport layers to use as fallbacks
 * @param options - Configuration options
 * @returns Layer providing TransportService with failover capability
 *
 * @since 0.0.1
 *
 * @example Basic fallback between multiple HTTP transports
 * ```typescript
 * import { Effect } from 'effect'
 * import { FallbackTransport, HttpTransport, ProviderService, Provider } from 'voltaire-effect/services'
 *
 * const transport = FallbackTransport([
 *   HttpTransport('https://eth.llamarpc.com'),
 *   HttpTransport('https://rpc.ankr.com/eth'),
 *   HttpTransport('https://cloudflare-eth.com')
 * ])
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(transport)
 * )
 * ```
 *
 * @example With latency-based ranking
 * ```typescript
 * const transport = FallbackTransport([
 *   HttpTransport('https://eth.llamarpc.com'),
 *   HttpTransport('https://rpc.ankr.com/eth'),
 * ], {
 *   rank: true,      // Sort by latency
 *   retryCount: 2    // Retry twice per transport before switching
 * })
 * ```
 */
export const FallbackTransport = (
	transports: Layer.Layer<TransportService>[],
	options: FallbackTransportOptions = {},
): Layer.Layer<TransportService> => {
	if (transports.length === 0) {
		return Layer.fail(
			new TransportError(
				{ code: -32603, message: "No transports provided" },
				"FallbackTransport requires at least one transport",
			),
		);
	}

	const retryCount = options.retryCount ?? 3;
	const retryDelay = options.retryDelay ?? 150;
	const shouldRank = options.rank ?? false;

	const instances: TransportInstance[] = transports.map((t) => ({
		transport: t,
		failures: 0,
		latency: Number.POSITIVE_INFINITY,
	}));

	const getOrderedInstances = (): TransportInstance[] => {
		const available = instances.filter((i) => i.failures < retryCount);
		if (shouldRank) {
			return [...available].sort((a, b) => a.latency - b.latency);
		}
		return available;
	};

	return Layer.succeed(TransportService, {
		request: <T>(
			method: string,
			params: unknown[] = [],
		): Effect.Effect<T, TransportError> =>
			Effect.gen(function* () {
				const ordered = getOrderedInstances();

				if (ordered.length === 0) {
					for (const instance of instances) {
						instance.failures = 0;
					}
					ordered.push(...getOrderedInstances());
				}

				for (const instance of ordered) {
					let attemptsLeft = retryCount;

					while (attemptsLeft > 0) {
						const start = Date.now();

						const result = yield* Effect.gen(function* () {
							const transport = yield* TransportService;
							return yield* transport.request<T>(method, params);
						}).pipe(
							Effect.provide(instance.transport),
							Effect.tap(() => {
								instance.latency = Date.now() - start;
								instance.failures = 0;
							}),
							Effect.map((value) => Option.some(value)),
							Effect.catchAll(() => {
								attemptsLeft--;
								instance.failures++;
								return Effect.succeed(Option.none<T>());
							}),
						);

						if (Option.isSome(result)) {
							return result.value;
						}

						if (attemptsLeft > 0) {
							yield* Effect.sleep(retryDelay);
						}
					}
				}

				return yield* Effect.fail(
					new TransportError(
						{ code: -32603, message: "All transports failed" },
						`All ${transports.length} transports failed after retries`,
					),
				);
			}),
	});
};
