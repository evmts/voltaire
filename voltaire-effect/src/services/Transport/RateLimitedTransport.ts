/**
 * @fileoverview Rate-limited transport wrapper for JSON-RPC requests.
 *
 * @module RateLimitedTransport
 * @since 0.0.1
 *
 * @description
 * Wraps an existing TransportService layer to apply rate limiting when a
 * RateLimiterService is available in the environment. If no rate limiter
 * is provided, requests pass through unchanged.
 *
 * Supports:
 * - Global and per-method limits (via RateLimiterService config)
 * - Token bucket or fixed window strategies
 * - onExceeded behavior: "delay" | "fail"
 *
 * @see {@link RateLimiterService} - Rate limiter service and config
 * @see {@link DefaultRateLimiter} - Default RateLimiterService implementation
 * @see {@link TransportService} - Transport interface being wrapped
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import {
	RateLimitError,
	RateLimiterService,
} from "../RateLimiter/index.js";
import { TransportError } from "./TransportError.js";
import { TransportService, type TransportShape } from "./TransportService.js";

const RATE_LIMIT_ERROR_CODE = -32005;

const toRateLimitTransportError = (error: RateLimitError): TransportError =>
	new TransportError(
		{
			code: RATE_LIMIT_ERROR_CODE,
			message: error.message,
			data: { method: error.method, type: error._tag },
		},
		undefined,
		{
			cause: error,
			context: { method: error.method, type: error._tag },
		},
	);

const toTransportError = (error: unknown): TransportError => {
	if (error instanceof TransportError) return error;
	if (error instanceof RateLimitError) return toRateLimitTransportError(error);
	return new TransportError(
		{
			code: -32603,
			message: error instanceof Error ? error.message : String(error),
		},
		undefined,
		{ cause: error },
	);
};

/**
 * Creates a transport wrapper that applies rate limiting when available.
 *
 * @description
 * Wraps a base transport layer and applies RateLimiterService if present.
 * This allows opt-in rate limiting by simply providing a RateLimiter layer.
 *
 * @param baseTransport - The transport layer to wrap
 * @returns Layer with optional rate limiting
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Duration } from "effect"
 * import {
 *   DefaultRateLimiter,
 *   HttpTransport,
 *   RateLimitedTransport,
 *   TransportService
 * } from "voltaire-effect/services"
 *
 * const transport = RateLimitedTransport(
 *   HttpTransport("https://eth.example.com")
 * )
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request("eth_blockNumber")
 * }).pipe(
 *   Effect.scoped,
 *   Effect.provide(transport),
 *   Effect.provide(
 *     DefaultRateLimiter({
 *       global: { limit: 100, interval: Duration.seconds(1) },
 *       onExceeded: "delay"
 *     })
 *   )
 * )
 * ```
 */
export const RateLimitedTransport = (
	baseTransport: Layer.Layer<TransportService, unknown, unknown>,
): Layer.Layer<TransportService, TransportError, unknown> =>
	Layer.flatMap(baseTransport, (context) =>
		Layer.succeed(
			TransportService,
			TransportService.of({
				request: <T>(method: string, params: unknown[] = []) =>
					Effect.gen(function* () {
						const base = context.unsafeMap.get(
							TransportService.key,
						) as TransportShape;
						const limiterOption =
							yield* Effect.serviceOption(RateLimiterService);

						if (Option.isNone(limiterOption)) {
							return yield* base.request<T>(method, params);
						}

						return yield* limiterOption.value
							.withRateLimit(method, base.request<T>(method, params))
							.pipe(Effect.mapError(toTransportError));
					}),
			}),
		),
	);
