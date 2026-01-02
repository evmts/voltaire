import { describe, expect, test } from "vitest";
import { FP_MOD, G1_GENERATOR_X, G1_GENERATOR_Y } from "./constants.js";
import * as G1 from "./G1/index.js";
import { serializeG1 } from "./serializeG1.js";

describe("serializeG1", () => {
	describe("basic serialization", () => {
		test("serializes generator point", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(64);
		});

		test("serializes point at infinity as all zeros", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			expect(bytes.length).toBe(64);
			expect(bytes.every((b) => b === 0)).toBe(true);
		});

		test("serializes doubled generator", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const bytes = serializeG1(doubled);
			expect(bytes.length).toBe(64);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		test("serializes negated generator", () => {
			const gen = G1.generator();
			const negated = G1.negate(gen);
			const bytes = serializeG1(negated);
			expect(bytes.length).toBe(64);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});
	});

	describe("random valid points via scalar multiplication", () => {
		test("serializes G1 * 3", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 3n);
			const bytes = serializeG1(point);
			expect(bytes.length).toBe(64);
			expect(G1.isOnCurve(point)).toBe(true);
		});

		test("serializes G1 * 42", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 42n);
			const bytes = serializeG1(point);
			expect(bytes.length).toBe(64);
			expect(G1.isOnCurve(point)).toBe(true);
		});

		test("serializes G1 * 999", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 999n);
			const bytes = serializeG1(point);
			expect(bytes.length).toBe(64);
			expect(G1.isOnCurve(point)).toBe(true);
		});

		test("serializes G1 * large_scalar", () => {
			const gen = G1.generator();
			const largeScalar = 123456789012345678901234567890n;
			const point = G1.mul(gen, largeScalar);
			const bytes = serializeG1(point);
			expect(bytes.length).toBe(64);
			expect(G1.isOnCurve(point)).toBe(true);
		});
	});

	describe("coordinate encoding", () => {
		test("encodes generator with correct x coordinate", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const xBytes = bytes.slice(0, 32);
			const x = BigInt(
				`0x${Array.from(xBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(x).toBe(G1_GENERATOR_X);
		});

		test("encodes generator with correct y coordinate", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const yBytes = bytes.slice(32, 64);
			const y = BigInt(
				`0x${Array.from(yBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(y).toBe(G1_GENERATOR_Y);
		});

		test("encodes infinity with zero x coordinate", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			const xBytes = bytes.slice(0, 32);
			const x = BigInt(
				`0x${Array.from(xBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(x).toBe(0n);
		});

		test("encodes infinity with zero y coordinate", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			const yBytes = bytes.slice(32, 64);
			const y = BigInt(
				`0x${Array.from(yBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(y).toBe(0n);
		});
	});

	describe("format validation", () => {
		test("serialization is exactly 64 bytes", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			expect(bytes.length).toBe(64);
		});

		test("first 32 bytes represent x coordinate", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			expect(bytes.slice(0, 32).length).toBe(32);
		});

		test("last 32 bytes represent y coordinate", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			expect(bytes.slice(32, 64).length).toBe(32);
		});

		test("uses big-endian encoding", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			// Generator x = 1, so last byte of first 32 bytes should be 1
			expect(bytes[31]).toBe(1);
			// All bytes before should be 0 for x = 1
			for (let i = 0; i < 31; i++) {
				expect(bytes[i]).toBe(0);
			}
		});
	});

	describe("determinism", () => {
		test("serialization is deterministic for generator", () => {
			const gen = G1.generator();
			const bytes1 = serializeG1(gen);
			const bytes2 = serializeG1(gen);
			expect(bytes1).toEqual(bytes2);
		});

		test("serialization is deterministic for infinity", () => {
			const inf = G1.infinity();
			const bytes1 = serializeG1(inf);
			const bytes2 = serializeG1(inf);
			expect(bytes1).toEqual(bytes2);
		});

		test("serialization is deterministic for random point", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 7777n);
			const bytes1 = serializeG1(point);
			const bytes2 = serializeG1(point);
			expect(bytes1).toEqual(bytes2);
		});
	});

	describe("distinct points have distinct serializations", () => {
		test("generator and doubled generator serialize differently", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const bytes1 = serializeG1(gen);
			const bytes2 = serializeG1(doubled);
			expect(bytes1).not.toEqual(bytes2);
		});

		test("generator and negated generator serialize differently", () => {
			const gen = G1.generator();
			const negated = G1.negate(gen);
			const bytes1 = serializeG1(gen);
			const bytes2 = serializeG1(negated);
			expect(bytes1).not.toEqual(bytes2);
		});

		test("different scalar multiples serialize differently", () => {
			const gen = G1.generator();
			const point1 = G1.mul(gen, 5n);
			const point2 = G1.mul(gen, 10n);
			const bytes1 = serializeG1(point1);
			const bytes2 = serializeG1(point2);
			expect(bytes1).not.toEqual(bytes2);
		});

		test("generator and infinity serialize differently", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			const bytes1 = serializeG1(gen);
			const bytes2 = serializeG1(inf);
			expect(bytes1).not.toEqual(bytes2);
		});
	});

	describe("coordinates within field modulus", () => {
		test("serialized x coordinate is less than field modulus", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const xBytes = bytes.slice(0, 32);
			const x = BigInt(
				`0x${Array.from(xBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(x < FP_MOD).toBe(true);
		});

		test("serialized y coordinate is less than field modulus", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const yBytes = bytes.slice(32, 64);
			const y = BigInt(
				`0x${Array.from(yBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(y < FP_MOD).toBe(true);
		});

		test("coordinates of random points are less than field modulus", () => {
			const gen = G1.generator();
			const point = G1.mul(gen, 12345n);
			const bytes = serializeG1(point);

			const xBytes = bytes.slice(0, 32);
			const x = BigInt(
				`0x${Array.from(xBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			const yBytes = bytes.slice(32, 64);
			const y = BigInt(
				`0x${Array.from(yBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			expect(x < FP_MOD).toBe(true);
			expect(y < FP_MOD).toBe(true);
		});
	});

	describe("uncompressed format", () => {
		test("uses uncompressed format (64 bytes)", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			// Uncompressed format: x || y = 32 + 32 = 64 bytes
			expect(bytes.length).toBe(64);
		});

		test("both coordinates present in serialization", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);

			// Extract and verify both coordinates exist and are non-zero for generator
			const xBytes = bytes.slice(0, 32);
			const yBytes = bytes.slice(32, 64);

			const x = BigInt(
				`0x${Array.from(xBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const y = BigInt(
				`0x${Array.from(yBytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			expect(x).toBeGreaterThan(0n);
			expect(y).toBeGreaterThan(0n);
		});
	});
});
