import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { CacheService } from "./CacheService.js";
import { NoopCache } from "./NoopCache.js";

describe("NoopCache", () => {
	describe("get", () => {
		it.effect("always returns none", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				const result = yield* cache.get("any-key");
				expect(Option.isNone(result)).toBe(true);
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("returns none even after set", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key", "value");
				const result = yield* cache.get("key");
				expect(Option.isNone(result)).toBe(true);
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("returns none for complex values", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key", { nested: { data: [1, 2, 3] } });
				const result = yield* cache.get<{ nested: { data: number[] } }>("key");
				expect(Option.isNone(result)).toBe(true);
			}).pipe(Effect.provide(NoopCache)),
		);
	});

	describe("set", () => {
		it.effect("completes without error", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key", "value");
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("completes with TTL without error", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key", "value", 1000);
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("handles multiple sets", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key1", "value1");
				yield* cache.set("key2", "value2");
				yield* cache.set("key3", "value3");
			}).pipe(Effect.provide(NoopCache)),
		);
	});

	describe("delete", () => {
		it.effect("always returns false", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				const result = yield* cache.delete("any-key");
				expect(result).toBe(false);
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("returns false even after set", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key", "value");
				const result = yield* cache.delete("key");
				expect(result).toBe(false);
			}).pipe(Effect.provide(NoopCache)),
		);
	});

	describe("clear", () => {
		it.effect("completes without error", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.clear();
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("can be called multiple times", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.clear();
				yield* cache.clear();
				yield* cache.clear();
			}).pipe(Effect.provide(NoopCache)),
		);
	});

	describe("layer behavior", () => {
		it.effect("same layer instance always returns none", () =>
			Effect.gen(function* () {
				const cache = yield* CacheService;
				yield* cache.set("key", "value");
				const r1 = yield* cache.get("key");
				const r2 = yield* cache.get("key");
				const r3 = yield* cache.get("key");
				expect(Option.isNone(r1)).toBe(true);
				expect(Option.isNone(r2)).toBe(true);
				expect(Option.isNone(r3)).toBe(true);
			}).pipe(Effect.provide(NoopCache)),
		);
	});

	describe("use case: testing without cache interference", () => {
		it.effect("function that uses cache works with NoopCache", () =>
			Effect.gen(function* () {
				const fetchWithCache = (key: string) =>
					Effect.gen(function* () {
						const cache = yield* CacheService;
						const cached = yield* cache.get<string>(key);
						if (Option.isSome(cached)) {
							return { source: "cache", value: cached.value };
						}
						const fetched = `fetched-${key}`;
						yield* cache.set(key, fetched, 60000);
						return { source: "fetch", value: fetched };
					});

				const result = yield* fetchWithCache("test-key");
				expect(result.source).toBe("fetch");
				expect(result.value).toBe("fetched-test-key");
			}).pipe(Effect.provide(NoopCache)),
		);

		it.effect("always fetches fresh with NoopCache", () =>
			Effect.gen(function* () {
				let fetchCount = 0;
				const fetchWithCache = (key: string) =>
					Effect.gen(function* () {
						const cache = yield* CacheService;
						const cached = yield* cache.get<string>(key);
						if (Option.isSome(cached)) {
							return cached.value;
						}
						fetchCount++;
						const value = `value-${fetchCount}`;
						yield* cache.set(key, value);
						return value;
					});

				const r1 = yield* fetchWithCache("key");
				const r2 = yield* fetchWithCache("key");
				const r3 = yield* fetchWithCache("key");

				expect([r1, r2, r3]).toEqual(["value-1", "value-2", "value-3"]);
				expect(fetchCount).toBe(3);
			}).pipe(Effect.provide(NoopCache)),
		);
	});
});
