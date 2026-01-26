import { describe, expect, it } from "@effect/vitest";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as TestClock from "effect/TestClock";
import {
	DefaultRateLimiter,
	NoopRateLimiter,
	RateLimitError,
	RateLimiterService,
} from "./index.js";

describe("RateLimiterService", () => {
	describe("DefaultRateLimiter", () => {
		it.scoped("applies global rate limit with delay behavior", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				let callCount = 0;
				const incrementEffect = Effect.sync(() => {
					callCount++;
					return callCount;
				});

				const result1 = yield* rateLimiter.withRateLimit(
					"eth_call",
					incrementEffect,
				);
				const result2 = yield* rateLimiter.withRateLimit(
					"eth_call",
					incrementEffect,
				);

				expect(result1).toBe(1);
				expect(result2).toBe(2);
				expect(callCount).toBe(2);
			}).pipe(
				Effect.provide(
					DefaultRateLimiter({ global: { limit: 10, interval: "1 seconds" } }),
				),
			),
		);

		it.scoped("applies per-method rate limits", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				expect(rateLimiter.getLimiter("eth_call")).toBeDefined();
				expect(rateLimiter.getLimiter("eth_getLogs")).toBeDefined();
				expect(rateLimiter.getLimiter("eth_blockNumber")).toBeUndefined();
				expect(rateLimiter.getGlobalLimiter()).toBeUndefined();
			}).pipe(
				Effect.provide(
					DefaultRateLimiter({
						methods: {
							eth_call: { limit: 50, interval: "1 seconds" },
							eth_getLogs: { limit: 5, interval: "1 seconds" },
						},
					}),
				),
			),
		);

		it.scoped("combines global and per-method limits", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				expect(rateLimiter.getGlobalLimiter()).toBeDefined();
				expect(rateLimiter.getLimiter("eth_call")).toBeDefined();
			}).pipe(
				Effect.provide(
					DefaultRateLimiter({
						global: { limit: 100, interval: "1 seconds" },
						methods: {
							eth_call: { limit: 50, interval: "1 seconds" },
						},
					}),
				),
			),
		);

		it.scoped("fails immediately with fail behavior when limit exceeded", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				yield* rateLimiter.consume("eth_call");

				const result = yield* rateLimiter.consume("eth_call").pipe(
					Effect.flip,
				);

				expect(result).toBeInstanceOf(RateLimitError);
				expect(result.method).toBe("eth_call");
			}).pipe(
				Effect.provide(
					DefaultRateLimiter({
						global: { limit: 1, interval: "1 seconds" },
						behavior: "fail",
					}),
				),
			),
		);

		it.scoped("exposes config", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				expect(rateLimiter.config).toEqual({
					global: { limit: 10, interval: "1 seconds" },
					behavior: "fail",
				});
			}).pipe(
				Effect.provide(
					DefaultRateLimiter({
						global: { limit: 10, interval: "1 seconds" },
						behavior: "fail",
					}),
				),
			),
		);

		it.scoped("consume respects cost parameter", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				yield* rateLimiter.consume("eth_call", 5);

				const result = yield* rateLimiter.consume("eth_call", 6).pipe(
					Effect.flip,
				);

				expect(result).toBeInstanceOf(RateLimitError);
			}).pipe(
				Effect.provide(
					DefaultRateLimiter({
						global: { limit: 10, interval: "1 seconds" },
						behavior: "fail",
					}),
				),
			),
		);
	});

	describe("NoopRateLimiter", () => {
		it.effect("does not limit anything", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				let callCount = 0;
				for (let i = 0; i < 100; i++) {
					yield* rateLimiter.withRateLimit(
						"eth_call",
						Effect.sync(() => callCount++),
					);
				}

				expect(callCount).toBe(100);
				expect(rateLimiter.getLimiter("eth_call")).toBeUndefined();
				expect(rateLimiter.getGlobalLimiter()).toBeUndefined();
			}).pipe(Effect.provide(NoopRateLimiter)),
		);

		it.effect("consume never fails", () =>
			Effect.gen(function* () {
				const rateLimiter = yield* RateLimiterService;

				for (let i = 0; i < 100; i++) {
					yield* rateLimiter.consume("eth_call");
				}
			}).pipe(Effect.provide(NoopRateLimiter)),
		);
	});

	describe("RateLimitError", () => {
		it("has correct tag", () => {
			const error = new RateLimitError({
				method: "eth_call",
				message: "Rate limit exceeded",
			});

			expect(error._tag).toBe("RateLimitError");
			expect(error.method).toBe("eth_call");
			expect(error.message).toBe("Rate limit exceeded");
		});
	});
});
