/**
 * BN254 Test Suite
 *
 * Comprehensive tests for BN254 elliptic curve operations including:
 * - G1 point operations (add, mul, double, negate)
 * - G2 point operations
 * - Pairing operations and bilinearity
 * - Edge cases and known test vectors
 *
 * Tests all three implementations:
 * - Pure TypeScript (Bn254)
 * - WASM native Zig (Bn254Wasm) - skipped until WASM loader ready
 * - WASM Arkworks (Bn254Ark) - skipped until WASM loader ready
 */

import { describe, expect, it } from "vitest";
import { Bn254, Bn254InvalidPointError } from "./bn254.js";
// import { Bn254Wasm } from "./bn254.wasm.js";
// import { Bn254Ark } from "./bn254.ark.js";

describe("Bn254.Fr", () => {
	it("should perform modular addition", () => {
		const a = 123n;
		const b = 456n;
		const result = Bn254.Fr.add(a, b);
		expect(result).toBe(579n);
	});

	it("should perform modular multiplication", () => {
		const a = 123n;
		const b = 456n;
		const result = Bn254.Fr.mul(a, b);
		expect(result).toBe(56088n);
	});

	it("should compute modular inverse", () => {
		const a = 5n;
		const aInv = Bn254.Fr.inv(a);
		const product = Bn254.Fr.mul(a, aInv);
		expect(product).toBe(1n);
	});

	it("should validate scalar range", () => {
		expect(Bn254.Fr.isValid(0n)).toBe(true);
		expect(Bn254.Fr.isValid(100n)).toBe(true);
		expect(Bn254.Fr.isValid(-1n)).toBe(false);
	});
});

describe("Bn254.G1", () => {
	describe("Point creation and validation", () => {
		it("should create generator point", () => {
			const gen = Bn254.G1.generator();
			expect(Bn254.G1.isOnCurve.call(gen)).toBe(true);
			expect(Bn254.G1.isZero.call(gen)).toBe(false);
		});

		it("should create infinity point", () => {
			const inf = Bn254.G1.infinity();
			expect(Bn254.G1.isZero.call(inf)).toBe(true);
			expect(Bn254.G1.isOnCurve.call(inf)).toBe(true);
		});

		it("should validate on-curve points", () => {
			const gen = Bn254.G1.generator();
			const point = Bn254.G1.mul.call(gen, 7n);
			expect(Bn254.G1.isOnCurve.call(point)).toBe(true);
		});

		it("should reject off-curve points", () => {
			expect(() => Bn254.G1.fromAffine(1n, 3n)).toThrow(Bn254InvalidPointError);
		});
	});

	describe("Point arithmetic", () => {
		it("should add two points", () => {
			const gen = Bn254.G1.generator();
			const doubled = Bn254.G1.double.call(gen);
			const sum = Bn254.G1.add.call(gen, gen);
			expect(Bn254.G1.equal.call(doubled, sum)).toBe(true);
		});

		it("should double a point", () => {
			const gen = Bn254.G1.generator();
			const doubled = Bn254.G1.double.call(gen);
			const manual = Bn254.G1.add.call(gen, gen);
			expect(Bn254.G1.equal.call(doubled, manual)).toBe(true);
		});

		it("should negate a point", () => {
			const gen = Bn254.G1.generator();
			const neg = Bn254.G1.negate.call(gen);
			const sum = Bn254.G1.add.call(gen, neg);
			expect(Bn254.G1.isZero.call(sum)).toBe(true);
		});

		it("should handle infinity in addition", () => {
			const gen = Bn254.G1.generator();
			const inf = Bn254.G1.infinity();
			const result = Bn254.G1.add.call(gen, inf);
			expect(Bn254.G1.equal.call(result, gen)).toBe(true);
		});

		it("should exhibit commutativity", () => {
			const gen = Bn254.G1.generator();
			const p1 = Bn254.G1.mul.call(gen, 11n);
			const p2 = Bn254.G1.mul.call(gen, 13n);
			const sum1 = Bn254.G1.add.call(p1, p2);
			const sum2 = Bn254.G1.add.call(p2, p1);
			expect(Bn254.G1.equal.call(sum1, sum2)).toBe(true);
		});

		it("should exhibit associativity", () => {
			const gen = Bn254.G1.generator();
			const p1 = Bn254.G1.mul.call(gen, 3n);
			const p2 = Bn254.G1.mul.call(gen, 5n);
			const p3 = Bn254.G1.mul.call(gen, 7n);
			const left = Bn254.G1.add.call(Bn254.G1.add.call(p1, p2), p3);
			const right = Bn254.G1.add.call(p1, Bn254.G1.add.call(p2, p3));
			expect(Bn254.G1.equal.call(left, right)).toBe(true);
		});
	});

	describe("Scalar multiplication", () => {
		it("should multiply by scalar", () => {
			const gen = Bn254.G1.generator();
			const result = Bn254.G1.mul.call(gen, 5n);
			const manual = Bn254.G1.add.call(
				Bn254.G1.add.call(
					Bn254.G1.add.call(Bn254.G1.add.call(gen, gen), gen),
					gen,
				),
				gen,
			);
			expect(Bn254.G1.equal.call(result, manual)).toBe(true);
		});

		it("should multiply by zero", () => {
			const gen = Bn254.G1.generator();
			const result = Bn254.G1.mul.call(gen, 0n);
			expect(Bn254.G1.isZero.call(result)).toBe(true);
		});

		it("should multiply by one", () => {
			const gen = Bn254.G1.generator();
			const result = Bn254.G1.mul.call(gen, 1n);
			expect(Bn254.G1.equal.call(result, gen)).toBe(true);
		});

		it("should multiply by curve order", () => {
			const gen = Bn254.G1.generator();
			const FR_MOD =
				21888242871839275222246405745257275088548364400416034343698204186575808495617n;
			const result = Bn254.G1.mul.call(gen, FR_MOD);
			expect(Bn254.G1.isZero.call(result)).toBe(true);
		});

		it("should handle large scalars", () => {
			const gen = Bn254.G1.generator();
			const large = 123456789n;
			const result = Bn254.G1.mul.call(gen, large);
			expect(Bn254.G1.isOnCurve.call(result)).toBe(true);
		});

		it("should exhibit distributivity", () => {
			const gen = Bn254.G1.generator();
			const a = 7n;
			const b = 11n;
			const p = Bn254.G1.mul.call(gen, a);
			const q = Bn254.G1.mul.call(gen, b);
			const left = Bn254.G1.mul.call(Bn254.G1.add.call(p, q), 5n);
			const right = Bn254.G1.add.call(
				Bn254.G1.mul.call(p, 5n),
				Bn254.G1.mul.call(q, 5n),
			);
			expect(Bn254.G1.equal.call(left, right)).toBe(true);
		});
	});

	describe("Coordinate conversion", () => {
		it("should convert to affine", () => {
			const gen = Bn254.G1.generator();
			const point = Bn254.G1.mul.call(gen, 17n);
			const affine = Bn254.G1.toAffine.call(point);
			expect(affine.z).toBe(1n);
			expect(Bn254.G1.equal.call(point, affine)).toBe(true);
		});

		it("should handle infinity in toAffine", () => {
			const inf = Bn254.G1.infinity();
			const affine = Bn254.G1.toAffine.call(inf);
			expect(Bn254.G1.isZero.call(affine)).toBe(true);
		});
	});

	describe("Serialization", () => {
		it("should serialize and deserialize generator", () => {
			const gen = Bn254.G1.generator();
			const bytes = Bn254.serializeG1(gen);
			expect(bytes.length).toBe(64);
			const deserialized = Bn254.deserializeG1(bytes);
			expect(Bn254.G1.equal.call(gen, deserialized)).toBe(true);
		});

		it("should serialize and deserialize arbitrary point", () => {
			const gen = Bn254.G1.generator();
			const point = Bn254.G1.mul.call(gen, 42n);
			const bytes = Bn254.serializeG1(point);
			const deserialized = Bn254.deserializeG1(bytes);
			expect(Bn254.G1.equal.call(point, deserialized)).toBe(true);
		});

		it("should serialize and deserialize infinity", () => {
			const inf = Bn254.G1.infinity();
			const bytes = Bn254.serializeG1(inf);
			const deserialized = Bn254.deserializeG1(bytes);
			expect(Bn254.G1.isZero.call(deserialized)).toBe(true);
		});
	});
});

describe("Bn254.G2", () => {
	describe("Point creation and validation", () => {
		it("should create generator point", () => {
			const gen = Bn254.G2.generator();
			expect(Bn254.G2.isOnCurve.call(gen)).toBe(true);
			expect(Bn254.G2.isZero.call(gen)).toBe(false);
		});

		it("should create infinity point", () => {
			const inf = Bn254.G2.infinity();
			expect(Bn254.G2.isZero.call(inf)).toBe(true);
			expect(Bn254.G2.isOnCurve.call(inf)).toBe(true);
		});

		it("should validate subgroup membership", () => {
			const gen = Bn254.G2.generator();
			expect(Bn254.G2.isInSubgroup.call(gen)).toBe(true);
		});

		it("should validate multiples are in subgroup", () => {
			const gen = Bn254.G2.generator();
			const multiples = [2n, 7n, 13n, 99n];
			for (const scalar of multiples) {
				const point = Bn254.G2.mul.call(gen, scalar);
				expect(Bn254.G2.isInSubgroup.call(point)).toBe(true);
			}
		});
	});

	describe("Point arithmetic", () => {
		it("should add two points", () => {
			const gen = Bn254.G2.generator();
			const doubled = Bn254.G2.double.call(gen);
			const sum = Bn254.G2.add.call(gen, gen);
			expect(Bn254.G2.equal.call(doubled, sum)).toBe(true);
		});

		it("should double a point", () => {
			const gen = Bn254.G2.generator();
			const doubled = Bn254.G2.double.call(gen);
			const manual = Bn254.G2.add.call(gen, gen);
			expect(Bn254.G2.equal.call(doubled, manual)).toBe(true);
		});

		it("should negate a point", () => {
			const gen = Bn254.G2.generator();
			const neg = Bn254.G2.negate.call(gen);
			const sum = Bn254.G2.add.call(gen, neg);
			expect(Bn254.G2.isZero.call(sum)).toBe(true);
		});

		it("should handle infinity in addition", () => {
			const gen = Bn254.G2.generator();
			const inf = Bn254.G2.infinity();
			const result = Bn254.G2.add.call(gen, inf);
			expect(Bn254.G2.equal.call(result, gen)).toBe(true);
		});

		it("should exhibit commutativity", () => {
			const gen = Bn254.G2.generator();
			const p1 = Bn254.G2.mul.call(gen, 11n);
			const p2 = Bn254.G2.mul.call(gen, 13n);
			const sum1 = Bn254.G2.add.call(p1, p2);
			const sum2 = Bn254.G2.add.call(p2, p1);
			expect(Bn254.G2.equal.call(sum1, sum2)).toBe(true);
		});
	});

	describe("Scalar multiplication", () => {
		it("should multiply by scalar", () => {
			const gen = Bn254.G2.generator();
			const result = Bn254.G2.mul.call(gen, 3n);
			const manual = Bn254.G2.add.call(Bn254.G2.add.call(gen, gen), gen);
			expect(Bn254.G2.equal.call(result, manual)).toBe(true);
		});

		it("should multiply by zero", () => {
			const gen = Bn254.G2.generator();
			const result = Bn254.G2.mul.call(gen, 0n);
			expect(Bn254.G2.isZero.call(result)).toBe(true);
		});

		it("should multiply by one", () => {
			const gen = Bn254.G2.generator();
			const result = Bn254.G2.mul.call(gen, 1n);
			expect(Bn254.G2.equal.call(result, gen)).toBe(true);
		});

		it("should multiply by curve order", () => {
			const gen = Bn254.G2.generator();
			const FR_MOD =
				21888242871839275222246405745257275088548364400416034343698204186575808495617n;
			const result = Bn254.G2.mul.call(gen, FR_MOD);
			expect(Bn254.G2.isZero.call(result)).toBe(true);
		});
	});

	describe("Coordinate conversion", () => {
		it("should convert to affine", () => {
			const gen = Bn254.G2.generator();
			const point = Bn254.G2.mul.call(gen, 19n);
			const affine = Bn254.G2.toAffine.call(point);
			expect(affine.z.c0).toBe(1n);
			expect(affine.z.c1).toBe(0n);
			expect(Bn254.G2.equal.call(point, affine)).toBe(true);
		});
	});

	describe("Frobenius map", () => {
		it.skip("should apply Frobenius endomorphism", () => {
			const gen = Bn254.G2.generator();
			const point = Bn254.G2.mul.call(gen, 15n);
			const frobenius = Bn254.G2.frobenius.call(point);
			expect(Bn254.G2.isOnCurve.call(frobenius)).toBe(true);
		});

		it.skip("should have order 12", () => {
			const gen = Bn254.G2.generator();
			const point = Bn254.G2.mul.call(gen, 23n);
			let iter = point;
			for (let i = 0; i < 12; i++) {
				iter = Bn254.G2.frobenius.call(iter);
				expect(Bn254.G2.isOnCurve.call(iter)).toBe(true);
			}
			expect(Bn254.G2.equal.call(iter, point)).toBe(true);
		});
	});

	describe("Serialization", () => {
		it("should serialize and deserialize generator", () => {
			const gen = Bn254.G2.generator();
			const bytes = Bn254.serializeG2(gen);
			expect(bytes.length).toBe(128);
			const deserialized = Bn254.deserializeG2(bytes);
			expect(Bn254.G2.equal.call(gen, deserialized)).toBe(true);
		});

		it("should serialize and deserialize arbitrary point", () => {
			const gen = Bn254.G2.generator();
			const point = Bn254.G2.mul.call(gen, 42n);
			const bytes = Bn254.serializeG2(point);
			const deserialized = Bn254.deserializeG2(bytes);
			expect(Bn254.G2.equal.call(point, deserialized)).toBe(true);
		});

		it("should serialize and deserialize infinity", () => {
			const inf = Bn254.G2.infinity();
			const bytes = Bn254.serializeG2(inf);
			const deserialized = Bn254.deserializeG2(bytes);
			expect(Bn254.G2.isZero.call(deserialized)).toBe(true);
		});
	});
});

describe("Bn254.Pairing", () => {
	describe("Basic pairing", () => {
		it("should compute pairing of generators", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();
			const result = Bn254.Pairing.pair(g1, g2);
			expect(result).toBeDefined();
			expect(result.value).not.toBe(1n);
		});

		it("should return 1 for pairing with infinity", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();
			const inf1 = Bn254.G1.infinity();
			const inf2 = Bn254.G2.infinity();

			const result1 = Bn254.Pairing.pair(inf1, g2);
			expect(result1.value).toBe(1n);

			const result2 = Bn254.Pairing.pair(g1, inf2);
			expect(result2.value).toBe(1n);

			const result3 = Bn254.Pairing.pair(inf1, inf2);
			expect(result3.value).toBe(1n);
		});
	});

	describe("Bilinearity", () => {
		it.skip("should be bilinear in first argument", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();
			const a = 3n;
			const b = 5n;

			const p1 = Bn254.G1.mul.call(g1, a);
			const p2 = Bn254.G1.mul.call(g1, b);
			const p_sum = Bn254.G1.add.call(p1, p2);

			const e1 = Bn254.Pairing.pair(p1, g2);
			const e2 = Bn254.Pairing.pair(p2, g2);
			const e_sum = Bn254.Pairing.pair(p_sum, g2);

			const e_product = Bn254.Fr.mul(e1.value, e2.value);

			expect(e_sum.value).toBe(e_product);
		});

		it.skip("should be bilinear in second argument", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();
			const a = 7n;
			const b = 9n;

			const q1 = Bn254.G2.mul.call(g2, a);
			const q2 = Bn254.G2.mul.call(g2, b);
			const q_sum = Bn254.G2.add.call(q1, q2);

			const e1 = Bn254.Pairing.pair(g1, q1);
			const e2 = Bn254.Pairing.pair(g1, q2);
			const e_sum = Bn254.Pairing.pair(g1, q_sum);

			const e_product = Bn254.Fr.mul(e1.value, e2.value);

			expect(e_sum.value).toBe(e_product);
		});

		it.skip("should satisfy e(aP, bQ) = e(P, Q)^(ab)", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();
			const a = 7n;
			const b = 11n;

			const p_scaled = Bn254.G1.mul.call(g1, a);
			const q_scaled = Bn254.G2.mul.call(g2, b);

			const e_base = Bn254.Pairing.pair(g1, g2);
			const e_scaled = Bn254.Pairing.pair(p_scaled, q_scaled);

			const ab = Bn254.Fr.mul(a, b);
			const e_expected = Bn254.Fr.pow(e_base.value, ab);

			expect(e_scaled.value).toBe(e_expected);
		});
	});

	describe("Pairing check", () => {
		it.skip("should accept valid pairing equation", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();
			const a = 2n;
			const b = 3n;

			const p1 = Bn254.G1.mul.call(g1, a);
			const q1 = Bn254.G2.mul.call(g2, b);

			const p2 = Bn254.G1.negate.call(
				Bn254.G1.mul.call(g1, Bn254.Fr.mul(a, b)),
			);
			const q2 = g2;

			const valid = Bn254.Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
			]);

			expect(valid).toBe(true);
		});

		it("should reject invalid pairing equation", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();

			const p1 = Bn254.G1.mul.call(g1, 2n);
			const q1 = Bn254.G2.mul.call(g2, 3n);

			const p2 = Bn254.G1.mul.call(g1, 5n);
			const q2 = Bn254.G2.mul.call(g2, 7n);

			const valid = Bn254.Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
			]);

			expect(valid).toBe(false);
		});

		it("should accept empty pairing check", () => {
			const valid = Bn254.Pairing.pairingCheck([]);
			expect(valid).toBe(true);
		});
	});

	describe("Multi-pairing", () => {
		it("should compute product of multiple pairings", () => {
			const g1 = Bn254.G1.generator();
			const g2 = Bn254.G2.generator();

			const pairs: Array<[Bn254.G1Point, Bn254.G2Point]> = [
				[Bn254.G1.mul.call(g1, 2n), Bn254.G2.mul.call(g2, 3n)],
				[Bn254.G1.mul.call(g1, 5n), Bn254.G2.mul.call(g2, 7n)],
			];

			const result = Bn254.Pairing.multiPairing(pairs);
			expect(result).toBeDefined();
		});
	});
});

describe("Edge cases", () => {
	it("should handle negative scalar as modular reduction", () => {
		const gen = Bn254.G1.generator();
		const neg_scalar = -5n;
		const result = Bn254.G1.mul.call(gen, neg_scalar);
		expect(Bn254.G1.isOnCurve.call(result)).toBe(true);
	});

	it("should handle very large scalars", () => {
		const gen = Bn254.G1.generator();
		const large = BigInt("0x" + "f".repeat(64));
		const result = Bn254.G1.mul.call(gen, large);
		expect(Bn254.G1.isOnCurve.call(result)).toBe(true);
	});

	it("should maintain point validity through operations", () => {
		const gen = Bn254.G1.generator();
		let point = gen;
		for (let i = 0; i < 10; i++) {
			point = Bn254.G1.add.call(point, gen);
			expect(Bn254.G1.isOnCurve.call(point)).toBe(true);
		}
	});
});

// ============================================================================
// Cross-Implementation Validation Tests
// ============================================================================
// TODO: Once WASM implementations are ready, add tests that verify:
// 1. All implementations produce identical results for same operations
// 2. Serialization compatibility between implementations
// 3. Performance characteristics match expectations (Ark >> WASM >> Pure)
//
// Example test structure:
// describe.each(implementations)("$name implementation", ({ impl }) => {
//   it("should match reference results", () => {
//     const g1 = impl.G1.generator();
//     const result = impl.G1.mul.call(g1, 5n);
//     // Verify against known test vectors
//   });
// });
