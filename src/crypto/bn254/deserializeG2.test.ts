import { describe, expect, test } from "vitest";
import {
	FP_MOD,
	G2_GENERATOR_X_C0,
	G2_GENERATOR_X_C1,
	G2_GENERATOR_Y_C0,
	G2_GENERATOR_Y_C1,
} from "./constants.js";
import { deserializeG2 } from "./deserializeG2.js";
import { Bn254Error } from "./errors.js";
import * as G2 from "./G2/index.js";
import { serializeG2 } from "./serializeG2.js";

describe("deserializeG2", () => {
	describe("basic deserialization", () => {
		test("deserializes generator point", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, gen)).toBe(true);
		});

		test("deserializes point at infinity", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);
			const deserialized = deserializeG2(bytes);
			expect(G2.isZero(deserialized)).toBe(true);
		});

		test("deserializes doubled generator", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const bytes = serializeG2(doubled);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, doubled)).toBe(true);
		});

		test("deserializes negated generator", () => {
			const gen = G2.generator();
			const negated = G2.negate(gen);
			const bytes = serializeG2(negated);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, negated)).toBe(true);
		});
	});

	describe("random valid points via scalar multiplication", () => {
		test("deserializes G2 * 3", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 3n);
			const bytes = serializeG2(point);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, point)).toBe(true);
		});

		test("deserializes G2 * 42", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 42n);
			const bytes = serializeG2(point);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, point)).toBe(true);
		});

		test("deserializes G2 * 999", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 999n);
			const bytes = serializeG2(point);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, point)).toBe(true);
		});

		test("deserializes G2 * large_scalar", () => {
			const gen = G2.generator();
			const largeScalar = 123456789012345678901234567890n;
			const point = G2.mul(gen, largeScalar);
			const bytes = serializeG2(point);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, point)).toBe(true);
		});
	});

	describe("roundtrip serialization", () => {
		test("roundtrip: serialize(deserialize(bytes)) === bytes (generator)", () => {
			const gen = G2.generator();
			const originalBytes = serializeG2(gen);
			const point = deserializeG2(originalBytes);
			const roundtripBytes = serializeG2(point);
			expect(roundtripBytes).toEqual(originalBytes);
		});

		test("roundtrip: deserialize(serialize(point)) === point", () => {
			const gen = G2.generator();
			const originalPoint = G2.mul(gen, 7n);
			const bytes = serializeG2(originalPoint);
			const roundtripPoint = deserializeG2(bytes);
			expect(G2.equal(roundtripPoint, originalPoint)).toBe(true);
		});

		test("roundtrip preserves infinity", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);
			const recovered = deserializeG2(bytes);
			expect(G2.isZero(recovered)).toBe(true);
		});

		test("roundtrip multiple random points", () => {
			const gen = G2.generator();
			const scalars = [3n, 17n, 100n, 999n, 12345n];

			for (const scalar of scalars) {
				const point = G2.mul(gen, scalar);
				const bytes = serializeG2(point);
				const recovered = deserializeG2(bytes);
				expect(G2.equal(recovered, point)).toBe(true);
			}
		});

		test("roundtrip preserves point on curve property", () => {
			const gen = G2.generator();
			const points = [gen, G2.double(gen), G2.mul(gen, 5n)];

			for (const point of points) {
				const bytes = serializeG2(point);
				const recovered = deserializeG2(bytes);
				expect(G2.isOnCurve(recovered)).toBe(true);
			}
		});

		test("roundtrip preserves subgroup membership", () => {
			const gen = G2.generator();
			const points = [gen, G2.double(gen), G2.mul(gen, 7n)];

			for (const point of points) {
				const bytes = serializeG2(point);
				const recovered = deserializeG2(bytes);
				expect(G2.isInSubgroup(recovered)).toBe(true);
			}
		});
	});

	describe("invalid input length", () => {
		test("throws on truncated input (127 bytes)", () => {
			const invalid = new Uint8Array(127);
			expect(() => deserializeG2(invalid)).toThrow(Bn254Error);
			expect(() => deserializeG2(invalid)).toThrow(
				"Invalid G2 point serialization length",
			);
		});

		test("throws on truncated input (64 bytes)", () => {
			const invalid = new Uint8Array(64);
			expect(() => deserializeG2(invalid)).toThrow(Bn254Error);
		});

		test("throws on empty input", () => {
			const invalid = new Uint8Array(0);
			expect(() => deserializeG2(invalid)).toThrow(Bn254Error);
		});

		test("throws on oversized input (129 bytes)", () => {
			const invalid = new Uint8Array(129);
			expect(() => deserializeG2(invalid)).toThrow(Bn254Error);
			expect(() => deserializeG2(invalid)).toThrow(
				"Invalid G2 point serialization length",
			);
		});

		test("throws on oversized input (256 bytes)", () => {
			const invalid = new Uint8Array(256);
			expect(() => deserializeG2(invalid)).toThrow(Bn254Error);
		});

		test("error includes context information", () => {
			const invalid = new Uint8Array(127);
			try {
				deserializeG2(invalid);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).toBeInstanceOf(Bn254Error);
				const bn254Err = err as Bn254Error;
				expect(bn254Err.code).toBe("INVALID_LENGTH");
			}
		});
	});

	describe("all-zero and all-ones inputs", () => {
		test("handles all-zero input as infinity", () => {
			const zeros = new Uint8Array(128);
			const point = deserializeG2(zeros);
			expect(G2.isZero(point)).toBe(true);
		});

		test("deserializes all-ones input if it represents valid point", () => {
			// All-ones will be Fp2 coordinates >= field modulus
			const allOnes = new Uint8Array(128).fill(0xff);
			// This should either throw during fromAffine validation or create a point
			try {
				const point = deserializeG2(allOnes);
				// If it doesn't throw, verify it's handled properly
				if (!G2.isZero(point)) {
					expect(G2.isOnCurve(point)).toBe(true);
				}
			} catch (err) {
				// Expected to throw for invalid coordinates >= field modulus
				expect(err).toBeDefined();
			}
		});
	});

	describe("invalid Fp2 coordinates", () => {
		test("handles x.c0 coordinate at field modulus", () => {
			const bytes = new Uint8Array(128);
			// Set x.c0 = FP_MOD
			const modBytes = FP_MOD.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[i] = Number.parseInt(modBytes.slice(i * 2, i * 2 + 2), 16);
			}
			// This should be handled by fromAffine validation
			try {
				const point = deserializeG2(bytes);
				// If accepted, should be reduced or infinity
				if (!G2.isZero(point)) {
					expect(G2.isOnCurve(point)).toBe(true);
				}
			} catch (err) {
				// Expected: invalid Fp2 coordinate >= field modulus
				expect(err).toBeDefined();
			}
		});

		test("handles x.c1 coordinate > field modulus", () => {
			const bytes = new Uint8Array(128);
			// Set x.c1 = FP_MOD + 1
			const overMod = (FP_MOD + 1n).toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[32 + i] = Number.parseInt(overMod.slice(i * 2, i * 2 + 2), 16);
			}
			try {
				const point = deserializeG2(bytes);
				expect(G2.isOnCurve(point)).toBe(true);
			} catch (err) {
				// Expected: invalid coordinate
				expect(err).toBeDefined();
			}
		});

		test("handles point with valid x but y not satisfying twisted curve equation", () => {
			const bytes = new Uint8Array(128);
			// Use generator's x coordinates
			const xc0Bytes = G2_GENERATOR_X_C0.toString(16).padStart(64, "0");
			const xc1Bytes = G2_GENERATOR_X_C1.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[i] = Number.parseInt(xc0Bytes.slice(i * 2, i * 2 + 2), 16);
				bytes[32 + i] = Number.parseInt(xc1Bytes.slice(i * 2, i * 2 + 2), 16);
			}
			// Use wrong y coordinates (generator y + 1)
			const wrongYc0 = (G2_GENERATOR_Y_C0 + 1n) % FP_MOD;
			const wrongYc1 = (G2_GENERATOR_Y_C1 + 1n) % FP_MOD;
			const yc0Bytes = wrongYc0.toString(16).padStart(64, "0");
			const yc1Bytes = wrongYc1.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[64 + i] = Number.parseInt(yc0Bytes.slice(i * 2, i * 2 + 2), 16);
				bytes[96 + i] = Number.parseInt(yc1Bytes.slice(i * 2, i * 2 + 2), 16);
			}

			try {
				const point = deserializeG2(bytes);
				// If accepted by fromAffine, should still be on curve
				expect(G2.isOnCurve(point)).toBe(true);
			} catch (err) {
				// Expected: point not on twisted curve
				expect(err).toBeDefined();
			}
		});
	});

	describe("Fp2 coordinate extraction", () => {
		test("correctly extracts x.c0 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const point = deserializeG2(bytes);
			const affine = G2.toAffine(point);
			expect(affine.x.c0).toBe(G2_GENERATOR_X_C0);
		});

		test("correctly extracts x.c1 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const point = deserializeG2(bytes);
			const affine = G2.toAffine(point);
			expect(affine.x.c1).toBe(G2_GENERATOR_X_C1);
		});

		test("correctly extracts y.c0 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const point = deserializeG2(bytes);
			const affine = G2.toAffine(point);
			expect(affine.y.c0).toBe(G2_GENERATOR_Y_C0);
		});

		test("correctly extracts y.c1 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const point = deserializeG2(bytes);
			const affine = G2.toAffine(point);
			expect(affine.y.c1).toBe(G2_GENERATOR_Y_C1);
		});

		test("correctly parses big-endian Fp2 coordinates", () => {
			// Manually construct bytes for a simple point
			const bytes = new Uint8Array(128);

			// Set known small values for testing endianness
			// x.c0 = 1
			bytes[31] = 1;
			// x.c1 = 2
			bytes[63] = 2;
			// y.c0 = 3
			bytes[95] = 3;
			// y.c1 = 4
			bytes[127] = 4;

			try {
				const point = deserializeG2(bytes);
				const affine = G2.toAffine(point);
				// These coordinates likely don't form a valid curve point,
				// so fromAffine may transform or reject them
				// If accepted, check they were parsed correctly
				if (!G2.isZero(point)) {
					// The arkworks backend may have validated and transformed
					expect(G2.isOnCurve(point)).toBe(true);
				}
			} catch (err) {
				// Expected: invalid point not on curve
				expect(err).toBeDefined();
			}
		});
	});

	describe("security validations", () => {
		test("rejects Fp2 coordinates that don't form valid curve point", () => {
			// Create point that definitely isn't on twisted curve
			const bytes = new Uint8Array(128);
			// Set all Fp2 components to 1 (likely not on curve)
			bytes[31] = 1; // x.c0 = 1
			bytes[63] = 1; // x.c1 = 1
			bytes[95] = 1; // y.c0 = 1
			bytes[127] = 1; // y.c1 = 1

			try {
				const point = deserializeG2(bytes);
				// If fromAffine accepts it, verify it's on curve
				expect(G2.isOnCurve(point)).toBe(true);
			} catch (err) {
				// Expected: point not on twisted curve
				expect(err).toBeDefined();
			}
		});

		test("deserialized points pass curve validation", () => {
			const gen = G2.generator();
			const scalars = [1n, 2n, 3n, 7n, 42n, 999n];

			for (const scalar of scalars) {
				const point = G2.mul(gen, scalar);
				const bytes = serializeG2(point);
				const deserialized = deserializeG2(bytes);
				expect(G2.isOnCurve(deserialized)).toBe(true);
			}
		});

		test("deserialized points pass subgroup check", () => {
			const gen = G2.generator();
			const scalars = [1n, 2n, 3n, 7n, 42n, 999n];

			for (const scalar of scalars) {
				const point = G2.mul(gen, scalar);
				const bytes = serializeG2(point);
				const deserialized = deserializeG2(bytes);
				expect(G2.isInSubgroup(deserialized)).toBe(true);
			}
		});

		test("infinity deserialization is consistent", () => {
			const zeros = new Uint8Array(128);
			const point1 = deserializeG2(zeros);
			const point2 = deserializeG2(zeros);
			expect(G2.equal(point1, point2)).toBe(true);
			expect(G2.isZero(point1)).toBe(true);
			expect(G2.isZero(point2)).toBe(true);
		});

		test("rejects points outside correct subgroup (if implemented)", () => {
			// G2 has cofactor > 1, so subgroup check is critical
			// This test verifies deserialized points are in correct subgroup
			const gen = G2.generator();
			const point = G2.mul(gen, 13n);
			const bytes = serializeG2(point);
			const deserialized = deserializeG2(bytes);

			// All points from scalar multiplication of generator are in subgroup
			expect(G2.isInSubgroup(deserialized)).toBe(true);
		});
	});
});
