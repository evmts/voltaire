import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import {
	calculateGas,
	ModExpLive,
	ModExpService,
	ModExpTest,
	modexp,
	modexpBytes,
} from "./index.js";

describe("ModExpService", () => {
	describe("ModExpLive", () => {
		it.effect("computes 2^10 mod 1000 = 24", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexp(2n, 10n, 1000n);
				expect(result).toBe(24n);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("computes 3^13 mod 17 = 12", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexp(3n, 13n, 17n);
				expect(result).toBe(12n);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("handles zero exponent", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexp(5n, 0n, 7n);
				expect(result).toBe(1n);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("handles zero base", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexp(0n, 5n, 7n);
				expect(result).toBe(0n);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("handles modulus of 1", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexp(5n, 3n, 1n);
				expect(result).toBe(0n);
			}).pipe(Effect.provide(ModExpLive)),
		);
	});

	describe("modexpBytes", () => {
		it.effect("computes 2^3 mod 5 = 3 with byte arrays", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexpBytes(
					new Uint8Array([0x02]),
					new Uint8Array([0x03]),
					new Uint8Array([0x05]),
				);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(1);
				expect(result[0]).toBe(0x03);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("pads output to modulus length", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexpBytes(
					new Uint8Array([0x02]),
					new Uint8Array([0x0a]),
					new Uint8Array([0x03, 0xe8]),
				);
				expect(result.length).toBe(2);
			}).pipe(Effect.provide(ModExpLive)),
		);
	});

	describe("calculateGas", () => {
		it.effect("returns minimum gas of 200", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.calculateGas(1n, 1n, 1n, 3n);
				expect(result).toBe(200n);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("calculates gas for larger inputs", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.calculateGas(
					64n,
					64n,
					64n,
					0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
				);
				expect(result).toBeGreaterThan(200n);
			}).pipe(Effect.provide(ModExpLive)),
		);
	});

	describe("ModExpTest", () => {
		it.effect("returns deterministic zero result", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexp(2n, 10n, 1000n);
				expect(result).toBe(0n);
			}).pipe(Effect.provide(ModExpTest)),
		);

		it.effect("returns zero-filled bytes for modexpBytes", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.modexpBytes(
					new Uint8Array([0x02]),
					new Uint8Array([0x03]),
					new Uint8Array([0x05]),
				);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(1);
				expect(result[0]).toBe(0);
			}).pipe(Effect.provide(ModExpTest)),
		);

		it.effect("returns minimum gas for calculateGas", () =>
			Effect.gen(function* () {
				const service = yield* ModExpService;
				const result = yield* service.calculateGas(64n, 64n, 64n, 255n);
				expect(result).toBe(200n);
			}).pipe(Effect.provide(ModExpTest)),
		);
	});
});

describe("operations", () => {
	describe("modexp", () => {
		it.effect("computes modular exponentiation with service dependency", () =>
			Effect.gen(function* () {
				const result = yield* modexp(2n, 10n, 1000n);
				expect(result).toBe(24n);
			}).pipe(Effect.provide(ModExpLive)),
		);

		it.effect("works with test layer", () =>
			Effect.gen(function* () {
				const result = yield* modexp(2n, 10n, 1000n);
				expect(result).toBe(0n);
			}).pipe(Effect.provide(ModExpTest)),
		);
	});

	describe("modexpBytes", () => {
		it.effect("computes with byte arrays using service", () =>
			Effect.gen(function* () {
				const result = yield* modexpBytes(
					new Uint8Array([0x02]),
					new Uint8Array([0x03]),
					new Uint8Array([0x05]),
				);
				expect(result[0]).toBe(0x03);
			}).pipe(Effect.provide(ModExpLive)),
		);
	});

	describe("calculateGas", () => {
		it.effect("calculates gas using service", () =>
			Effect.gen(function* () {
				const result = yield* calculateGas(1n, 1n, 1n, 3n);
				expect(result).toBe(200n);
			}).pipe(Effect.provide(ModExpLive)),
		);
	});
});
