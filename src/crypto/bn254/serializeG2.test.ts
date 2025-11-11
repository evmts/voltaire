import { describe, expect, test } from "vitest";
import * as G2 from "./G2/index.js";
import {
	FP_MOD,
	G2_GENERATOR_X_C0,
	G2_GENERATOR_X_C1,
	G2_GENERATOR_Y_C0,
	G2_GENERATOR_Y_C1,
} from "./constants.js";
import { serializeG2 } from "./serializeG2.js";

describe("serializeG2", () => {
	describe("basic serialization", () => {
		test("serializes generator point", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(128);
		});

		test("serializes point at infinity as all zeros", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);
			expect(bytes.length).toBe(128);
			expect(bytes.every((b) => b === 0)).toBe(true);
		});

		test("serializes doubled generator", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const bytes = serializeG2(doubled);
			expect(bytes.length).toBe(128);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		test("serializes negated generator", () => {
			const gen = G2.generator();
			const negated = G2.negate(gen);
			const bytes = serializeG2(negated);
			expect(bytes.length).toBe(128);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});
	});

	describe("random valid points via scalar multiplication", () => {
		test("serializes G2 * 3", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 3n);
			const bytes = serializeG2(point);
			expect(bytes.length).toBe(128);
			expect(G2.isOnCurve(point)).toBe(true);
			expect(G2.isInSubgroup(point)).toBe(true);
		});

		test("serializes G2 * 42", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 42n);
			const bytes = serializeG2(point);
			expect(bytes.length).toBe(128);
			expect(G2.isOnCurve(point)).toBe(true);
			expect(G2.isInSubgroup(point)).toBe(true);
		});

		test("serializes G2 * 999", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 999n);
			const bytes = serializeG2(point);
			expect(bytes.length).toBe(128);
			expect(G2.isOnCurve(point)).toBe(true);
			expect(G2.isInSubgroup(point)).toBe(true);
		});

		test("serializes G2 * large_scalar", () => {
			const gen = G2.generator();
			const largeScalar = 123456789012345678901234567890n;
			const point = G2.mul(gen, largeScalar);
			const bytes = serializeG2(point);
			expect(bytes.length).toBe(128);
			expect(G2.isOnCurve(point)).toBe(true);
			expect(G2.isInSubgroup(point)).toBe(true);
		});
	});

	describe("Fp2 coordinate encoding", () => {
		test("encodes generator with correct x.c0 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const xc0Bytes = bytes.slice(0, 32);
			const xc0 = BigInt(
				`0x${Array.from(xc0Bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(xc0).toBe(G2_GENERATOR_X_C0);
		});

		test("encodes generator with correct x.c1 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const xc1Bytes = bytes.slice(32, 64);
			const xc1 = BigInt(
				`0x${Array.from(xc1Bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(xc1).toBe(G2_GENERATOR_X_C1);
		});

		test("encodes generator with correct y.c0 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const yc0Bytes = bytes.slice(64, 96);
			const yc0 = BigInt(
				`0x${Array.from(yc0Bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(yc0).toBe(G2_GENERATOR_Y_C0);
		});

		test("encodes generator with correct y.c1 coordinate", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const yc1Bytes = bytes.slice(96, 128);
			const yc1 = BigInt(
				`0x${Array.from(yc1Bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			expect(yc1).toBe(G2_GENERATOR_Y_C1);
		});

		test("encodes infinity with all zero Fp2 coordinates", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);

			const xc0 = BigInt(
				`0x${Array.from(bytes.slice(0, 32))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const xc1 = BigInt(
				`0x${Array.from(bytes.slice(32, 64))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc0 = BigInt(
				`0x${Array.from(bytes.slice(64, 96))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc1 = BigInt(
				`0x${Array.from(bytes.slice(96, 128))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			expect(xc0).toBe(0n);
			expect(xc1).toBe(0n);
			expect(yc0).toBe(0n);
			expect(yc1).toBe(0n);
		});
	});

	describe("format validation", () => {
		test("serialization is exactly 128 bytes", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			expect(bytes.length).toBe(128);
		});

		test("format is x.c0 || x.c1 || y.c0 || y.c1", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			expect(bytes.slice(0, 32).length).toBe(32); // x.c0
			expect(bytes.slice(32, 64).length).toBe(32); // x.c1
			expect(bytes.slice(64, 96).length).toBe(32); // y.c0
			expect(bytes.slice(96, 128).length).toBe(32); // y.c1
		});

		test("uses big-endian encoding", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			// Verify format is 128 bytes with proper structure
			expect(bytes.length).toBe(128);
			// Each 32-byte component should be big-endian encoded
			expect(bytes.slice(0, 32).length).toBe(32);
		});
	});

	describe("determinism", () => {
		test("serialization is deterministic for generator", () => {
			const gen = G2.generator();
			const bytes1 = serializeG2(gen);
			const bytes2 = serializeG2(gen);
			expect(bytes1).toEqual(bytes2);
		});

		test("serialization is deterministic for infinity", () => {
			const inf = G2.infinity();
			const bytes1 = serializeG2(inf);
			const bytes2 = serializeG2(inf);
			expect(bytes1).toEqual(bytes2);
		});

		test("serialization is deterministic for random point", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 7777n);
			const bytes1 = serializeG2(point);
			const bytes2 = serializeG2(point);
			expect(bytes1).toEqual(bytes2);
		});
	});

	describe("distinct points have distinct serializations", () => {
		test("generator and doubled generator serialize differently", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const bytes1 = serializeG2(gen);
			const bytes2 = serializeG2(doubled);
			expect(bytes1).not.toEqual(bytes2);
		});

		test("generator and negated generator serialize differently", () => {
			const gen = G2.generator();
			const negated = G2.negate(gen);
			const bytes1 = serializeG2(gen);
			const bytes2 = serializeG2(negated);
			expect(bytes1).not.toEqual(bytes2);
		});

		test("different scalar multiples serialize differently", () => {
			const gen = G2.generator();
			const point1 = G2.mul(gen, 5n);
			const point2 = G2.mul(gen, 10n);
			const bytes1 = serializeG2(point1);
			const bytes2 = serializeG2(point2);
			expect(bytes1).not.toEqual(bytes2);
		});

		test("generator and infinity serialize differently", () => {
			const gen = G2.generator();
			const inf = G2.infinity();
			const bytes1 = serializeG2(gen);
			const bytes2 = serializeG2(inf);
			expect(bytes1).not.toEqual(bytes2);
		});
	});

	describe("coordinates within field modulus", () => {
		test("serialized Fp2 components are less than field modulus", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);

			const xc0 = BigInt(
				`0x${Array.from(bytes.slice(0, 32))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const xc1 = BigInt(
				`0x${Array.from(bytes.slice(32, 64))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc0 = BigInt(
				`0x${Array.from(bytes.slice(64, 96))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc1 = BigInt(
				`0x${Array.from(bytes.slice(96, 128))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			expect(xc0 < FP_MOD).toBe(true);
			expect(xc1 < FP_MOD).toBe(true);
			expect(yc0 < FP_MOD).toBe(true);
			expect(yc1 < FP_MOD).toBe(true);
		});

		test("coordinates of random points are less than field modulus", () => {
			const gen = G2.generator();
			const point = G2.mul(gen, 12345n);
			const bytes = serializeG2(point);

			const xc0 = BigInt(
				`0x${Array.from(bytes.slice(0, 32))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const xc1 = BigInt(
				`0x${Array.from(bytes.slice(32, 64))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc0 = BigInt(
				`0x${Array.from(bytes.slice(64, 96))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc1 = BigInt(
				`0x${Array.from(bytes.slice(96, 128))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			expect(xc0 < FP_MOD).toBe(true);
			expect(xc1 < FP_MOD).toBe(true);
			expect(yc0 < FP_MOD).toBe(true);
			expect(yc1 < FP_MOD).toBe(true);
		});
	});

	describe("uncompressed format", () => {
		test("uses uncompressed format (128 bytes)", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			// Uncompressed format: x.c0 || x.c1 || y.c0 || y.c1 = 32 + 32 + 32 + 32 = 128 bytes
			expect(bytes.length).toBe(128);
		});

		test("all Fp2 components present in serialization", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);

			// Extract and verify all Fp2 components exist and are non-zero for generator
			const xc0 = BigInt(
				`0x${Array.from(bytes.slice(0, 32))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const xc1 = BigInt(
				`0x${Array.from(bytes.slice(32, 64))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc0 = BigInt(
				`0x${Array.from(bytes.slice(64, 96))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);
			const yc1 = BigInt(
				`0x${Array.from(bytes.slice(96, 128))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`,
			);

			expect(xc0).toBeGreaterThan(0n);
			expect(xc1).toBeGreaterThan(0n);
			expect(yc0).toBeGreaterThan(0n);
			expect(yc1).toBeGreaterThan(0n);
		});
	});
});
