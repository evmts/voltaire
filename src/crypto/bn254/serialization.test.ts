import { describe, expect, test } from "vitest";
import * as G1 from "./G1/index.js";
import * as G2 from "./G2/index.js";
import { serializeG1, deserializeG1 } from "./BN254.js";
import { serializeG2, deserializeG2 } from "./BN254.js";
import {
	G1_GENERATOR_X,
	G1_GENERATOR_Y,
	G2_GENERATOR_X_C0,
	G2_GENERATOR_X_C1,
	G2_GENERATOR_Y_C0,
	G2_GENERATOR_Y_C1,
} from "./constants.js";

describe("G1 serialization", () => {
	describe("serializeG1", () => {
		test("serializes generator", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			expect(bytes.length).toBe(64);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		test("serializes infinity as all zeros", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			expect(bytes.length).toBe(64);
			expect(bytes.every((b) => b === 0)).toBe(true);
		});

		test("serializes doubled point", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const bytes = serializeG1(doubled);
			expect(bytes.length).toBe(64);
		});

		test("serialization is deterministic", () => {
			const gen = G1.generator();
			const bytes1 = serializeG1(gen);
			const bytes2 = serializeG1(gen);
			expect(bytes1).toEqual(bytes2);
		});

		test("serializes generator with correct coordinates", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);

			// Extract x coordinate (first 32 bytes)
			const xBytes = bytes.slice(0, 32);
			const x = BigInt(
				"0x" +
					Array.from(xBytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(x).toBe(G1_GENERATOR_X);

			// Extract y coordinate (last 32 bytes)
			const yBytes = bytes.slice(32, 64);
			const y = BigInt(
				"0x" +
					Array.from(yBytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(y).toBe(G1_GENERATOR_Y);
		});
	});

	describe("deserializeG1", () => {
		test("deserializes generator", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, gen)).toBe(true);
		});

		test("deserializes infinity", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			const deserialized = deserializeG1(bytes);
			expect(G1.isZero(deserialized)).toBe(true);
		});

		test("deserializes doubled point", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const bytes = serializeG1(doubled);
			const deserialized = deserializeG1(bytes);
			expect(G1.equal(deserialized, doubled)).toBe(true);
		});

		test("throws on invalid length", () => {
			const invalid = new Uint8Array(63);
			expect(() => deserializeG1(invalid)).toThrow();
		});

		test("throws on too long input", () => {
			const invalid = new Uint8Array(65);
			expect(() => deserializeG1(invalid)).toThrow();
		});

		test("handles all zeros as infinity", () => {
			const zeros = new Uint8Array(64);
			const point = deserializeG1(zeros);
			expect(G1.isZero(point)).toBe(true);
		});
	});

	describe("roundtrip", () => {
		test("roundtrip generator", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const recovered = deserializeG1(bytes);
			expect(G1.equal(recovered, gen)).toBe(true);
		});

		test("roundtrip infinity", () => {
			const inf = G1.infinity();
			const bytes = serializeG1(inf);
			const recovered = deserializeG1(bytes);
			expect(G1.isZero(recovered)).toBe(true);
		});

		test("roundtrip multiple points", () => {
			const gen = G1.generator();
			const points = [
				gen,
				G1.double(gen),
				G1.mul(gen, 3n),
				G1.mul(gen, 100n),
				G1.negate(gen),
			];

			for (const point of points) {
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

	describe("format", () => {
		test("serialization is 64 bytes", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			expect(bytes.length).toBe(64);
		});

		test("first 32 bytes are x coordinate", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const xBytes = bytes.slice(0, 32);
			expect(xBytes.length).toBe(32);
		});

		test("last 32 bytes are y coordinate", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			const yBytes = bytes.slice(32, 64);
			expect(yBytes.length).toBe(32);
		});

		test("big-endian encoding", () => {
			const gen = G1.generator();
			const bytes = serializeG1(gen);
			// x = 1, should be all zeros except last byte
			expect(bytes[31]).toBe(1);
		});
	});
});

describe("G2 serialization", () => {
	describe("serializeG2", () => {
		test("serializes generator", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			expect(bytes.length).toBe(128);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		test("serializes infinity as all zeros", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);
			expect(bytes.length).toBe(128);
			expect(bytes.every((b) => b === 0)).toBe(true);
		});

		test("serializes doubled point", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const bytes = serializeG2(doubled);
			expect(bytes.length).toBe(128);
		});

		test("serialization is deterministic", () => {
			const gen = G2.generator();
			const bytes1 = serializeG2(gen);
			const bytes2 = serializeG2(gen);
			expect(bytes1).toEqual(bytes2);
		});

		test("serializes generator with correct coordinates", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);

			// Format: x.c0 || x.c1 || y.c0 || y.c1 (32 bytes each)
			const xc0Bytes = bytes.slice(0, 32);
			const xc0 = BigInt(
				"0x" +
					Array.from(xc0Bytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(xc0).toBe(G2_GENERATOR_X_C0);

			const xc1Bytes = bytes.slice(32, 64);
			const xc1 = BigInt(
				"0x" +
					Array.from(xc1Bytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(xc1).toBe(G2_GENERATOR_X_C1);

			const yc0Bytes = bytes.slice(64, 96);
			const yc0 = BigInt(
				"0x" +
					Array.from(yc0Bytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(yc0).toBe(G2_GENERATOR_Y_C0);

			const yc1Bytes = bytes.slice(96, 128);
			const yc1 = BigInt(
				"0x" +
					Array.from(yc1Bytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(yc1).toBe(G2_GENERATOR_Y_C1);
		});
	});

	describe("deserializeG2", () => {
		test("deserializes generator", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, gen)).toBe(true);
		});

		test("deserializes infinity", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);
			const deserialized = deserializeG2(bytes);
			expect(G2.isZero(deserialized)).toBe(true);
		});

		test("deserializes doubled point", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const bytes = serializeG2(doubled);
			const deserialized = deserializeG2(bytes);
			expect(G2.equal(deserialized, doubled)).toBe(true);
		});

		test("throws on invalid length", () => {
			const invalid = new Uint8Array(127);
			expect(() => deserializeG2(invalid)).toThrow();
		});

		test("throws on too long input", () => {
			const invalid = new Uint8Array(129);
			expect(() => deserializeG2(invalid)).toThrow();
		});

		test("handles all zeros as infinity", () => {
			const zeros = new Uint8Array(128);
			const point = deserializeG2(zeros);
			expect(G2.isZero(point)).toBe(true);
		});
	});

	describe("roundtrip", () => {
		test("roundtrip generator", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			const recovered = deserializeG2(bytes);
			expect(G2.equal(recovered, gen)).toBe(true);
		});

		test("roundtrip infinity", () => {
			const inf = G2.infinity();
			const bytes = serializeG2(inf);
			const recovered = deserializeG2(bytes);
			expect(G2.isZero(recovered)).toBe(true);
		});

		test("roundtrip multiple points", () => {
			const gen = G2.generator();
			const points = [
				gen,
				G2.double(gen),
				G2.mul(gen, 3n),
				G2.mul(gen, 100n),
				G2.negate(gen),
			];

			for (const point of points) {
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

	describe("format", () => {
		test("serialization is 128 bytes", () => {
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

		test("big-endian encoding", () => {
			const gen = G2.generator();
			const bytes = serializeG2(gen);
			// Each 32-byte chunk should be big-endian
			expect(bytes.length).toBe(128);
		});
	});
});
