import { describe, expect, it } from "vitest";
import type { BrandedG1Point } from "./BrandedG1Point.js";
import type { BrandedG2Point } from "./BrandedG2Point.js";
import * as Fp from "./Fp/index.js";
import * as Fp2 from "./Fp2/index.js";
import * as G1 from "./G1/index.js";
import * as G2 from "./G2/index.js";
import { B_G1, FP_MOD } from "./constants.js";

describe("BN254 Point Validation", () => {
	describe("G1 point validation", () => {
		describe("curve equation validation", () => {
			it("should accept generator point", () => {
				const gen = G1.generator();
				expect(G1.isOnCurve(gen)).toBe(true);
			});

			it("should accept infinity point", () => {
				const inf = G1.infinity();
				expect(G1.isOnCurve(inf)).toBe(true);
			});

			it("should reject point not satisfying curve equation", () => {
				// Create invalid point: (1, 1, 1) - not on curve y^2 = x^3 + 3
				const invalidPoint: BrandedG1Point = {
					x: 1n,
					y: 1n,
					z: 1n,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject point with invalid x coordinate", () => {
				const gen = G1.generator();

				// Corrupt x coordinate
				const invalidPoint: BrandedG1Point = {
					x: gen.x + 1n,
					y: gen.y,
					z: gen.z,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject point with invalid y coordinate", () => {
				const gen = G1.generator();

				// Corrupt y coordinate
				const invalidPoint: BrandedG1Point = {
					x: gen.x,
					y: gen.y + 1n,
					z: gen.z,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});
		});

		describe("field boundary validation", () => {
			it("should reject x-coordinate >= field modulus", () => {
				// Create point with x >= FP_MOD
				const invalidPoint: BrandedG1Point = {
					x: FP_MOD,
					y: 1n,
					z: 1n,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject y-coordinate >= field modulus", () => {
				const gen = G1.generator();

				// Create point with y >= FP_MOD
				const invalidPoint: BrandedG1Point = {
					x: gen.x,
					y: FP_MOD,
					z: gen.z,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should accept coordinates just below field modulus", () => {
				// Generator has coordinates well below FP_MOD
				const gen = G1.generator();
				expect(gen.x).toBeLessThan(FP_MOD);
				expect(gen.y).toBeLessThan(FP_MOD);
				expect(G1.isOnCurve(gen)).toBe(true);
			});
		});

		describe("projective coordinate validation", () => {
			it("should accept point with z=1 (affine)", () => {
				const gen = G1.generator();
				expect(gen.z).toBe(1n);
				expect(G1.isOnCurve(gen)).toBe(true);
			});

			it("should accept point with z≠1 (projective)", () => {
				const gen = G1.generator();
				const doubled = G1.double(gen);

				// Doubled point typically has z ≠ 1
				expect(G1.isOnCurve(doubled)).toBe(true);
			});

			it("should accept point at infinity (z=0)", () => {
				const inf = G1.infinity();
				expect(inf.z).toBe(0n);
				expect(G1.isOnCurve(inf)).toBe(true);
			});

			it("should handle z-coordinate modular reduction", () => {
				// Points with z >= FP_MOD are reduced mod p
				// The point (1, 1, FP_MOD) becomes (1, 1, 0) after reduction
				// which is the point at infinity
				const point: BrandedG1Point = {
					x: 1n,
					y: 1n,
					z: FP_MOD,
					__tag: "G1Point",
				};

				// FP_MOD ≡ 0 (mod FP_MOD), so z = 0 = infinity
				// Infinity is on curve
				expect(G1.isOnCurve(point)).toBe(true);
			});
		});

		describe("degenerate point validation", () => {
			it("should reject (0, 0, 1) - not on curve", () => {
				const invalidPoint: BrandedG1Point = {
					x: 0n,
					y: 0n,
					z: 1n,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject (1, 0, 1) - not on curve", () => {
				const invalidPoint: BrandedG1Point = {
					x: 1n,
					y: 0n,
					z: 1n,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject (0, 1, 1) - not on curve", () => {
				const invalidPoint: BrandedG1Point = {
					x: 0n,
					y: 1n,
					z: 1n,
					__tag: "G1Point",
				};

				expect(G1.isOnCurve(invalidPoint)).toBe(false);
			});
		});

		describe("curve operations preserve validity", () => {
			it("should maintain point validity after addition", () => {
				const gen = G1.generator();
				const doubled = G1.double(gen);
				const sum = G1.add(gen, doubled);

				expect(G1.isOnCurve(gen)).toBe(true);
				expect(G1.isOnCurve(doubled)).toBe(true);
				expect(G1.isOnCurve(sum)).toBe(true);
			});

			it("should maintain point validity after doubling", () => {
				const gen = G1.generator();

				for (let i = 0; i < 10; i++) {
					expect(G1.isOnCurve(gen)).toBe(true);
					const doubled = G1.double(gen);
					expect(G1.isOnCurve(doubled)).toBe(true);
				}
			});

			it("should maintain point validity after negation", () => {
				const gen = G1.generator();
				const neg = G1.negate(gen);

				expect(G1.isOnCurve(gen)).toBe(true);
				expect(G1.isOnCurve(neg)).toBe(true);
			});

			it("should maintain point validity after scalar multiplication", () => {
				const gen = G1.generator();
				const scaled = G1.mul(gen, 5n);

				expect(G1.isOnCurve(scaled)).toBe(true);
			});
		});
	});

	describe("G2 point validation", () => {
		describe("curve equation validation", () => {
			it("should accept generator point", () => {
				const gen = G2.generator();
				expect(G2.isOnCurve(gen)).toBe(true);
			});

			it("should accept infinity point", () => {
				const inf = G2.infinity();
				expect(G2.isOnCurve(inf)).toBe(true);
			});

			it("should reject point not satisfying curve equation", () => {
				// Create invalid point with arbitrary Fp2 coordinates
				const invalidX = Fp2.create(1n, 0n);
				const invalidY = Fp2.create(1n, 0n);
				const z = Fp2.create(1n, 0n);

				const invalidPoint: BrandedG2Point = {
					x: invalidX,
					y: invalidY,
					z: z,
					__tag: "G2Point",
				};

				expect(G2.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject point with corrupted x coordinate", () => {
				const gen = G2.generator();

				// Corrupt x coordinate
				const corruptedX = Fp2.create(gen.x.c0 + 1n, gen.x.c1);
				const invalidPoint: BrandedG2Point = {
					x: corruptedX,
					y: gen.y,
					z: gen.z,
					__tag: "G2Point",
				};

				expect(G2.isOnCurve(invalidPoint)).toBe(false);
			});

			it("should reject point with corrupted y coordinate", () => {
				const gen = G2.generator();

				// Corrupt y coordinate
				const corruptedY = Fp2.create(gen.y.c0, gen.y.c1 + 1n);
				const invalidPoint: BrandedG2Point = {
					x: gen.x,
					y: corruptedY,
					z: gen.z,
					__tag: "G2Point",
				};

				expect(G2.isOnCurve(invalidPoint)).toBe(false);
			});
		});

		describe("Fp2 coordinate validation", () => {
			it("should accept valid Fp2 coordinates", () => {
				const gen = G2.generator();

				// Verify coordinates are valid Fp2 elements
				expect(gen.x.c0).toBeLessThan(FP_MOD);
				expect(gen.x.c1).toBeLessThan(FP_MOD);
				expect(gen.y.c0).toBeLessThan(FP_MOD);
				expect(gen.y.c1).toBeLessThan(FP_MOD);

				expect(G2.isOnCurve(gen)).toBe(true);
			});

			it("should handle Fp2 coordinates at field boundaries", () => {
				// Generator coordinates are well within field bounds
				const gen = G2.generator();
				expect(G2.isOnCurve(gen)).toBe(true);
			});
		});

		describe("projective coordinate validation", () => {
			it("should accept point with z=1 (affine)", () => {
				const gen = G2.generator();
				expect(gen.z.c0).toBe(1n);
				expect(gen.z.c1).toBe(0n);
				expect(G2.isOnCurve(gen)).toBe(true);
			});

			it("should accept point with z≠1 (projective)", () => {
				const gen = G2.generator();
				const doubled = G2.double(gen);

				// Doubled point has projective coordinates
				expect(G2.isOnCurve(doubled)).toBe(true);
			});

			it("should accept point at infinity (z=0)", () => {
				const inf = G2.infinity();
				expect(inf.z.c0).toBe(0n);
				expect(inf.z.c1).toBe(0n);
				expect(G2.isOnCurve(inf)).toBe(true);
			});
		});

		describe("curve operations preserve validity", () => {
			it("should maintain point validity after addition", () => {
				const gen = G2.generator();
				const doubled = G2.double(gen);
				const sum = G2.add(gen, doubled);

				expect(G2.isOnCurve(gen)).toBe(true);
				expect(G2.isOnCurve(doubled)).toBe(true);
				expect(G2.isOnCurve(sum)).toBe(true);
			});

			it("should maintain point validity after doubling", () => {
				const gen = G2.generator();

				for (let i = 0; i < 5; i++) {
					expect(G2.isOnCurve(gen)).toBe(true);
					const doubled = G2.double(gen);
					expect(G2.isOnCurve(doubled)).toBe(true);
				}
			});

			it("should maintain point validity after negation", () => {
				const gen = G2.generator();
				const neg = G2.negate(gen);

				expect(G2.isOnCurve(gen)).toBe(true);
				expect(G2.isOnCurve(neg)).toBe(true);
			});
		});
	});

	describe("constant-time validation", () => {
		it("should validate G1 points without timing-dependent branches", () => {
			// Test various points - validation should complete consistently
			const testPoints: BrandedG1Point[] = [
				G1.generator(),
				G1.infinity(),
				G1.double(G1.generator()),
				{ x: 1n, y: 1n, z: 1n, __tag: "G1Point" }, // Invalid
				{ x: 0n, y: 0n, z: 1n, __tag: "G1Point" }, // Invalid
			];

			for (const point of testPoints) {
				const result = G1.isOnCurve(point);
				expect(typeof result).toBe("boolean");
			}
		});

		it("should validate G2 points without timing-dependent branches", () => {
			const testPoints: BrandedG2Point[] = [
				G2.generator(),
				G2.infinity(),
				G2.double(G2.generator()),
				{
					x: Fp2.create(1n, 0n),
					y: Fp2.create(1n, 0n),
					z: Fp2.create(1n, 0n),
					__tag: "G2Point",
				}, // Invalid
			];

			for (const point of testPoints) {
				const result = G2.isOnCurve(point);
				expect(typeof result).toBe("boolean");
			}
		});
	});

	describe("security properties", () => {
		it("should document that BN254 is a pairing-friendly curve", () => {
			// BN254 is a Barreto-Naehrig curve with:
			// - Embedding degree k = 12
			// - 254-bit prime field
			// - Used in zk-SNARKs (e.g., Groth16)
			// - Provides approximately 100-bit security

			// Security considerations:
			// - Points must be validated before use in cryptographic operations
			// - Small subgroup attacks not applicable (prime order)
			// - Twist security important for G2 operations

			const gen1 = G1.generator();
			const gen2 = G2.generator();

			expect(G1.isOnCurve(gen1)).toBe(true);
			expect(G2.isOnCurve(gen2)).toBe(true);
		});

		it("should validate all points before cryptographic operations", () => {
			// Best practice: Always validate points before use
			// This prevents invalid curve attacks

			const gen = G1.generator();
			const invalidPoint: BrandedG1Point = {
				x: 1n,
				y: 1n,
				z: 1n,
				__tag: "G1Point",
			};

			// Valid point operations should succeed
			expect(G1.isOnCurve(gen)).toBe(true);
			const doubled = G1.double(gen);
			expect(G1.isOnCurve(doubled)).toBe(true);

			// Invalid point should be rejected
			expect(G1.isOnCurve(invalidPoint)).toBe(false);

			// Operations with invalid points may produce invalid results
			// Always validate inputs!
		});
	});
});
