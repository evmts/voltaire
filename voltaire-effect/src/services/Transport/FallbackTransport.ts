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

import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schedule from "effect/Schedule";
import * as SynchronizedRef from "effect/SynchronizedRef";
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

interface TransportState {
	readonly failures: number;
	readonly latency: number;
}

interface TransportInstance {
	readonly transport: Layer.Layer<TransportService>;
	readonly stateRef: SynchronizedRef.SynchronizedRef<TransportState>;
}

const makeRetrySchedule = (retryCount: number, retryDelay: number) => {
	const retryLimit = Math.max(retryCount - 1, 0);
	return Schedule.spaced(Duration.millis(retryDelay)).pipe(
		Schedule.intersect(Schedule.recurs(retryLimit)),
	);
};

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
	const retrySchedule = makeRetrySchedule(retryCount, retryDelay);

	return Layer.scoped(
		TransportService,
		Effect.gen(function* () {
			const instances: TransportInstance[] = yield* Effect.all(
				transports.map((transport) =>
					Effect.gen(function* () {
						const stateRef = yield* SynchronizedRef.make<TransportState>({
							failures: 0,
							latency: Number.POSITIVE_INFINITY,
						});
						return { transport, stateRef };
					}),
				),
			);

			const getOrderedInstances = Effect.gen(function* () {
				const withState = yield* Effect.all(
					instances.map((instance) =>
						Effect.gen(function* () {
							const state = yield* SynchronizedRef.get(instance.stateRef);
							return { instance, failures: state.failures, latency: state.latency };
						}),
					),
				);
				const available = withState.filter((state) => state.failures < retryCount);
				if (shouldRank) {
					return [...available].sort((a, b) => a.latency - b.latency);
				}
				return available;
			});

			const resetAllFailures = Effect.all(
				instances.map((instance) =>
					SynchronizedRef.update(instance.stateRef, (state) => ({
						...state,
						failures: 0,
					})),
				),
				{ discard: true },
			);

			return {
				request: <T>(
					method: string,
					params: unknown[] = [],
				): Effect.Effect<T, TransportError> =>
					Effect.gen(function* () {
						let ordered = yield* getOrderedInstances;

						if (ordered.length === 0) {
							yield* resetAllFailures;
							ordered = yield* getOrderedInstances;
						}

						for (const { instance } of ordered) {
							const result = yield* Effect.gen(function* () {
								const transport = yield* TransportService;
								const [duration, value] = yield* transport
									.request<T>(method, params)
									.pipe(Effect.timed);
								const latency = Duration.toMillis(duration);
								yield* SynchronizedRef.update(instance.stateRef, (state) => ({
									...state,
									failures: 0,
									latency,
								}));
								return value;
							}).pipe(
								Effect.provide(instance.transport),
								Effect.tapError(() =>
									SynchronizedRef.update(instance.stateRef, (state) => ({
										...state,
										failures: state.failures + 1,
									})),
								),
								Effect.retry(retrySchedule),
								Effect.map((value) => Option.some(value)),
								Effect.catchAll(() => Effect.succeed(Option.none<T>())),
							);

							if (Option.isSome(result)) {
								return result.value;
							}
						}

						return yield* Effect.fail(
							new TransportError(
								{ code: -32603, message: "All transports failed" },
								`All ${transports.length} transports failed after retries`,
							),
						);
					}),
			};
		}),
	);
};
