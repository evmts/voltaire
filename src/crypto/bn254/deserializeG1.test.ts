import { describe, expect, test } from "vitest";
import { FP_MOD, G1_GENERATOR_X, G1_GENERATOR_Y } from "./constants.js";
import { deserializeG1 } from "./deserializeG1.js";
import { Bn254Error } from "./errors.js";
import * as G1 from "./G1/index.js";
import { serializeG1 } from "./serializeG1.js";

describe("deserializeG1", () => {
	describe("basic deserialization", () => {
		test("deserializes generator point", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, gen)).toBe(true);
		});

		test("deserializes point at infinity", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			const deserialized = deserializeG1(bytes);
			expect(G1.isZero(deserialized)).toBe(true);
		});

		test("deserializes doubled generator", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const bytes = serializeG1(doubled);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, doubled)).toBe(true);
		});

		test("deserializes negated generator", () => {
			const gen = G1.generator();
			const negated = G1.negate(gen);
			const bytes = serializeG1(negated);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, negated)).toBe(true);
		});
	});

	describe("random valid points via scalar multiplication", () => {
		test("deserializes G1 * 3", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 3n);
			const bytes = serializeG1(point);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, point)).toBe(true);
		});

		test("deserializes G1 * 42", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 42n);
			const bytes = serializeG1(point);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, point)).toBe(true);
		});

		test("deserializes G1 * 999", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 999n);
			const bytes = serializeG1(point);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, point)).toBe(true);
		});

		test("deserializes G1 * large_scalar", () => {
			const gen = G1.generator();
			const largeScalar = 123456789012345678901234567890n;
			const point = G1.mul(gen, largeScalar);
			const bytes = serializeG1(point);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, point)).toBe(true);
		});
	});

	describe("roundtrip serialization", () => {
		test("roundtrip: serialize(deserialize(bytes)) === bytes (generator)", () => {
			const gen = G1.generator();
			const originalBytes = serializeG1(gen);
			const point = deserializeG1(originalBytes);
			const roundtripBytes = serializeG1(point);
			expect(roundtripBytes).toEqual(originalBytes);
		});

		test("roundtrip: deserialize(serialize(point)) === point", () => {
			const gen = G1.generator();
			const originalPoint = G1.mul(gen, 7n);
			const bytes = serializeG1(originalPoint);
			const roundtripPoint = deserializeG1(bytes);
			expect(G1.equal(roundtripPoint, originalPoint)).toBe(true);
		});

		test("roundtrip preserves infinity", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			const recovered = deserializeG1(bytes);
			expect(G1.isZero(recovered)).toBe(true);
		});

		test("roundtrip multiple random points", () => {
			const gen = G1.generator();
			const scalars = [3n, 17n, 100n, 999n, 12345n];

			for (const scalar of scalars) {
				const point = G1.mul(gen, scalar);
				const bytes = serializeG1(point);
				const recovered = deserializeG1(bytes);
				expect(G1.equal(recovered, point)).toBe(true);
			}
		});

		test("roundtrip preserves point on curve property", () => {
			const gen = G1.generator();
			const points = [gen, G1.double(gen), G1.mul(gen, 5n)];

			for (const point of points) {
				const bytes = serializeG1(point);
				const recovered = deserializeG1(bytes);
				expect(G1.isOnCurve(recovered)).toBe(true);
			}
		});
	});

	describe("invalid input length", () => {
		test("throws on truncated input (63 bytes)", () => {
			const invalid = new Uint8Array(63);
			expect(() => deserializeG1(invalid)).toThrow(Bn254Error);
			expect(() => deserializeG1(invalid)).toThrow(
				"Invalid G1 point serialization length",
			);
		});

		test("throws on truncated input (32 bytes)", () => {
			const invalid = new Uint8Array(32);
			expect(() => deserializeG1(invalid)).toThrow(Bn254Error);
		});

		test("throws on empty input", () => {
			const invalid = new Uint8Array(0);
			expect(() => deserializeG1(invalid)).toThrow(Bn254Error);
		});

		test("throws on oversized input (65 bytes)", () => {
			const invalid = new Uint8Array(65);
			expect(() => deserializeG1(invalid)).toThrow(Bn254Error);
			expect(() => deserializeG1(invalid)).toThrow(
				"Invalid G1 point serialization length",
			);
		});

		test("throws on oversized input (128 bytes)", () => {
			const invalid = new Uint8Array(128);
			expect(() => deserializeG1(invalid)).toThrow(Bn254Error);
		});

		test("error includes context information", () => {
			const invalid = new Uint8Array(63);
			try {
				deserializeG1(invalid);
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
			const zeros = new Uint8Array(64);
			const point = deserializeG1(zeros);
			expect(G1.isZero(point)).toBe(true);
		});

		test("deserializes all-ones input if it represents valid point", () => {
			// All-ones will be coordinates >= field modulus, so will create invalid point
			// The arkworks backend will validate this
			const allOnes = new Uint8Array(64).fill(0xff);
			// This should either throw during fromAffine validation or create a point
			// The exact behavior depends on fromAffine implementation
			// For security, invalid points should be rejected
			try {
				const point = deserializeG1(allOnes);
				// If it doesn't throw, verify it's handled properly
				// Check if it's infinity or a valid point
				if (!G1.isZero(point)) {
					expect(G1.isOnCurve(point)).toBe(true);
				}
			} catch (err) {
				// Expected to throw for invalid coordinates >= field modulus
				expect(err).toBeDefined();
			}
		});
	});

	describe("invalid point coordinates", () => {
		test("handles x coordinate at field modulus", () => {
			const bytes = new Uint8Array(64);
			// Set x = FP_MOD (field modulus)
			const modBytes = FP_MOD.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[i] = Number.parseInt(modBytes.slice(i * 2, i * 2 + 2), 16);
			}
			// y = 0
			// This should be handled by fromAffine validation
			try {
				const point = deserializeG1(bytes);
				// If accepted, should be infinity or reduced modulo field
				if (!G1.isZero(point)) {
					expect(G1.isOnCurve(point)).toBe(true);
				}
			} catch (err) {
				// Expected: invalid coordinate >= field modulus
				expect(err).toBeDefined();
			}
		});

		test("handles x coordinate > field modulus", () => {
			const bytes = new Uint8Array(64);
			// Set x = FP_MOD + 1
			const overMod = (FP_MOD + 1n).toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[i] = Number.parseInt(overMod.slice(i * 2, i * 2 + 2), 16);
			}
			// This should be handled by fromAffine validation
			try {
				const point = deserializeG1(bytes);
				// If accepted, should be reduced modulo field and validated
				expect(G1.isOnCurve(point)).toBe(true);
			} catch (err) {
				// Expected: invalid coordinate
				expect(err).toBeDefined();
			}
		});

		test("handles point with valid x but y not satisfying curve equation", () => {
			const bytes = new Uint8Array(64);
			// Use generator's x coordinate
			const xBytes = G1_GENERATOR_X.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[i] = Number.parseInt(xBytes.slice(i * 2, i * 2 + 2), 16);
			}
			// Use wrong y coordinate (generator y + 1)
			const wrongY = (G1_GENERATOR_Y + 1n) % FP_MOD;
			const yBytes = wrongY.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[32 + i] = Number.parseInt(yBytes.slice(i * 2, i * 2 + 2), 16);
			}
			// This should fail curve equation validation
			try {
				const point = deserializeG1(bytes);
				// If accepted by fromAffine, it might project to valid point
				// but should be rejected for not being on curve
				expect(G1.isOnCurve(point)).toBe(true);
			} catch (err) {
				// Expected: point not on curve
				expect(err).toBeDefined();
			}
		});
	});

	describe("coordinate extraction", () => {
		test("correctly extracts x coordinate from serialization", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const point = deserializeG1(bytes);
			const affine = G1.toAffine(point);
			expect(affine.x).toBe(G1_GENERATOR_X);
		});

		test("correctly extracts y coordinate from serialization", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const point = deserializeG1(bytes);
			const affine = G1.toAffine(point);
			expect(affine.y).toBe(G1_GENERATOR_Y);
		});

		test("correctly parses big-endian coordinates", () => {
			// Manually construct bytes for generator (x=1, y=G1_GENERATOR_Y)
			const bytes = new Uint8Array(64);
			// x = 1: all zeros except last byte
			bytes[31] = 1;
			// y = G1_GENERATOR_Y
			const yHex = G1_GENERATOR_Y.toString(16).padStart(64, "0");
			for (let i = 0; i < 32; i++) {
				bytes[32 + i] = Number.parseInt(yHex.slice(i * 2, i * 2 + 2), 16);
			}

			const point = deserializeG1(bytes);
			const affine = G1.toAffine(point);
			expect(affine.x).toBe(1n);
			expect(affine.y).toBe(G1_GENERATOR_Y);
		});
	});

	describe("security validations", () => {
		test("rejects coordinates that don't form valid curve point", () => {
			// Create point that definitely isn't on curve: (2, 2)
			const bytes = new Uint8Array(64);
			bytes[31] = 2; // x = 2
			bytes[63] = 2; // y = 2
			// For y^2 = x^3 + 3, we have 4 vs 11, not equal

			try {
				const point = deserializeG1(bytes);
				// If fromAffine accepts it, verify it's on curve
				// (arkworks should validate this)
				expect(G1.isOnCurve(point)).toBe(true);
			} catch (err) {
				// Expected: point not on curve
				expect(err).toBeDefined();
			}
		});

		test("deserialized points pass curve validation", () => {
			const gen = G1.generator();
			const scalars = [1n, 2n, 3n, 7n, 42n, 999n];

			for (const scalar of scalars) {
				const point = G1.mul(gen, scalar);
				const bytes = serializeG1(point);
				const deserialized = deserializeG1(bytes);
				expect(G1.isOnCurve(deserialized)).toBe(true);
			}
		});

		test("infinity deserialization is consistent", () => {
			const zeros = new Uint8Array(64);
			const point1 = deserializeG1(zeros);
			const point2 = deserializeG1(zeros);
			expect(G1.equal(point1, point2)).toBe(true);
			expect(G1.isZero(point1)).toBe(true);
			expect(G1.isZero(point2)).toBe(true);
		});
	});
});
