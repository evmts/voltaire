import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";

describe("Uint256.toBytes", () => {
	describe("known values", () => {
		it("converts zero to 32 zero bytes", () => {
			const bytes = toBytes(ZERO);
			expect(bytes).toEqual(new Uint8Array(32));
			expect(bytes.length).toBe(32);
		});

		it("converts one", () => {
			const bytes = toBytes(ONE);
			expect(bytes.length).toBe(32);
			expect(bytes[31]).toBe(1);
			expect(bytes.slice(0, 31)).toEqual(new Uint8Array(31));
		});

		it("converts 255", () => {
			const bytes = toBytes(from(255n));
			expect(bytes[31]).toBe(255);
			expect(bytes.slice(0, 31)).toEqual(new Uint8Array(31));
		});

		it("converts 256", () => {
			const bytes = toBytes(from(256n));
			expect(bytes[30]).toBe(1);
			expect(bytes[31]).toBe(0);
		});
	});

	describe("edge cases", () => {
		it("converts MAX to all 0xFF bytes", () => {
			const bytes = toBytes(MAX);
			expect(bytes.length).toBe(32);
			expect(bytes.every((b) => b === 0xff)).toBe(true);
		});

		it("outputs big-endian format", () => {
			const value = from(0x0102030405060708n);
			const bytes = toBytes(value);
			expect(bytes[24]).toBe(0x01);
			expect(bytes[25]).toBe(0x02);
			expect(bytes[30]).toBe(0x07);
			expect(bytes[31]).toBe(0x08);
		});
	});

	describe("large values", () => {
		it("converts 128-bit value", () => {
			const value = from(1n << 128n);
			const bytes = toBytes(value);
			expect(bytes[15]).toBe(1);
			expect(bytes.slice(0, 15)).toEqual(new Uint8Array(15));
			expect(bytes.slice(16)).toEqual(new Uint8Array(16));
		});

		it("converts high bit set", () => {
			const value = from(1n << 255n);
			const bytes = toBytes(value);
			expect(bytes[0]).toBe(0x80);
			expect(bytes.slice(1)).toEqual(new Uint8Array(31));
		});
	});

	describe("ethereum compatibility (big-endian)", () => {
		it("produces correct big-endian bytes for EVM word encoding", () => {
			// Ethereum uses big-endian for uint256 in ABI encoding and storage
			// Value 0x1234 should be [0, 0, ..., 0x12, 0x34] (MSB first)
			const value = from(0x1234n);
			const bytes = toBytes(value);
			expect(bytes[30]).toBe(0x12);
			expect(bytes[31]).toBe(0x34);
		});

		it("matches expected RLP encoding format", () => {
			// RLP encodes integers in big-endian with no leading zeros
			// toBytes produces fixed 32-byte big-endian (padded on left)
			const value = from(0xdeadbeefn);
			const bytes = toBytes(value);
			expect(bytes[28]).toBe(0xde);
			expect(bytes[29]).toBe(0xad);
			expect(bytes[30]).toBe(0xbe);
			expect(bytes[31]).toBe(0xef);
		});

		it("MSB at index 0, LSB at index 31", () => {
			// Explicit verification: most significant byte at lowest index
			const value = from((0x80n << 248n) | 0x01n); // MSB=0x80, LSB=0x01
			const bytes = toBytes(value);
			expect(bytes[0]).toBe(0x80); // MSB at index 0
			expect(bytes[31]).toBe(0x01); // LSB at index 31
		});
	});

	describe("round-trip", () => {
		it("fromBytes(toBytes(x)) = x", () => {
			const values = [ZERO, ONE, from(255n), from(256n), from(1n << 128n), MAX];
			for (const v of values) {
				const bytes = toBytes(v);
				const restored = fromBytes(bytes);
				expect(restored).toBe(v);
			}
		});

		it("preserves all bit patterns", () => {
			const patterns = [
				0n,
				1n,
				0xffn,
				0xffffn,
				0xffffffffn,
				0xffffffffffffffffn,
				1n << 64n,
				1n << 128n,
				1n << 192n,
			];
			for (const p of patterns) {
				const uint = from(p);
				const bytes = toBytes(uint);
				const restored = fromBytes(bytes);
				expect(restored).toBe(uint);
			}
		});
	});
});
