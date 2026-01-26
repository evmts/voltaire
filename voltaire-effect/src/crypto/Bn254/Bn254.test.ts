import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
	Bn254Live,
	Bn254Service,
	Bn254Test,
	g1Add,
	g1Generator,
	g1Mul,
	g2Generator,
	pairingCheck,
} from "./index.js";

describe("Bn254Service", () => {
	describe("Bn254Live", () => {
		it.effect("generates G1 generator point", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const result = yield* bn254.g1Generator();
				expect(result).toHaveProperty("x");
				expect(result).toHaveProperty("y");
				expect(result).toHaveProperty("z");
				expect(typeof result.x).toBe("bigint");
			}).pipe(Effect.provide(Bn254Live))
		);

		it.effect("generates G2 generator point", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const result = yield* bn254.g2Generator();
				expect(result).toHaveProperty("x");
				expect(result).toHaveProperty("y");
				expect(result).toHaveProperty("z");
			}).pipe(Effect.provide(Bn254Live))
		);

		it.effect("adds G1 points", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const g1 = yield* bn254.g1Generator();
				const result = yield* bn254.g1Add(g1, g1);
				expect(result).toHaveProperty("x");
			}).pipe(Effect.provide(Bn254Live))
		);

		it.effect("multiplies G1 point by scalar", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const g1 = yield* bn254.g1Generator();
				const result = yield* bn254.g1Mul(g1, 5n);
				expect(result).toHaveProperty("x");
			}).pipe(Effect.provide(Bn254Live))
		);

		it.effect("performs pairing check", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const g1 = yield* bn254.g1Generator();
				const g2 = yield* bn254.g2Generator();
				const negG1 = yield* bn254.g1Mul(g1, -1n);
				const result = yield* bn254.pairingCheck([
					[g1, g2],
					[negG1, g2],
				]);
				expect(typeof result).toBe("boolean");
			}).pipe(Effect.provide(Bn254Live))
		);
	});

	describe("Bn254Test", () => {
		it.effect("returns mock G1 point", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const result = yield* bn254.g1Generator();
				expect(result).toHaveProperty("x");
				expect(result).toHaveProperty("y");
			}).pipe(Effect.provide(Bn254Test))
		);

		it.effect("returns true for pairing check", () =>
			Effect.gen(function* () {
				const bn254 = yield* Bn254Service;
				const g1 = yield* bn254.g1Generator();
				const g2 = yield* bn254.g2Generator();
				const result = yield* bn254.pairingCheck([[g1, g2]]);
				expect(result).toBe(true);
			}).pipe(Effect.provide(Bn254Test))
		);
	});
});

describe("convenience functions", () => {
	it.effect("g1Generator works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* g1Generator();
			expect(result).toHaveProperty("x");
		}).pipe(Effect.provide(Bn254Live))
	);

	it.effect("g2Generator works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* g2Generator();
			expect(result).toHaveProperty("x");
		}).pipe(Effect.provide(Bn254Live))
	);

	it.effect("g1Add works with service dependency", () =>
		Effect.gen(function* () {
			const g1 = yield* g1Generator();
			const result = yield* g1Add(g1, g1);
			expect(result).toHaveProperty("x");
		}).pipe(Effect.provide(Bn254Live))
	);

	it.effect("g1Mul works with service dependency", () =>
		Effect.gen(function* () {
			const g1 = yield* g1Generator();
			const result = yield* g1Mul(g1, 3n);
			expect(result).toHaveProperty("x");
		}).pipe(Effect.provide(Bn254Live))
	);

	it.effect("pairingCheck works with service dependency", () =>
		Effect.gen(function* () {
			const g1 = yield* g1Generator();
			const g2 = yield* g2Generator();
			const result = yield* pairingCheck([[g1, g2]]);
			expect(typeof result).toBe("boolean");
		}).pipe(Effect.provide(Bn254Live))
	);
});
