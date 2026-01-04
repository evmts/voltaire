/**
 * Tests for Rlp.decodeValue() - convenience function for direct value decoding
 *
 * @see https://github.com/williamcory/voltaire/issues/152
 */

import { describe, expect, it } from "vitest";
import { decodeValue } from "./decodeValue.js";
import { encode } from "./encode.js";
import { RlpDecodingError } from "./RlpError.js";

describe("Rlp.decodeValue", () => {
	describe("returns value directly (not wrapped object)", () => {
		it("decodes single byte to Uint8Array", () => {
			const input = new Uint8Array([0x42]);
			const result = decodeValue(input);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(new Uint8Array([0x42]));
		});

		it("decodes short string to Uint8Array", () => {
			const input = new Uint8Array([0x83, 1, 2, 3]);
			const result = decodeValue(input);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(new Uint8Array([1, 2, 3]));
		});

		it("decodes empty bytes to empty Uint8Array", () => {
			const input = new Uint8Array([0x80]);
			const result = decodeValue(input);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result).toEqual(new Uint8Array([]));
		});

		it("decodes list to array of Uint8Arrays", () => {
			const input = new Uint8Array([0xc2, 0x01, 0x02]);
			const result = decodeValue(input);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual([new Uint8Array([0x01]), new Uint8Array([0x02])]);
		});

		it("decodes empty list to empty array", () => {
			const input = new Uint8Array([0xc0]);
			const result = decodeValue(input);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual([]);
		});

		it("decodes nested list to nested arrays", () => {
			const input = new Uint8Array([0xc3, 0x01, 0xc1, 0x02]);
			const result = decodeValue(input);
			expect(result).toEqual([
				new Uint8Array([0x01]),
				[new Uint8Array([0x02])],
			]);
		});
	});

	describe("round-trip with encode", () => {
		it("round-trips bytes", () => {
			const original = new Uint8Array([1, 2, 3, 4, 5]);
			const encoded = encode(original);
			const decoded = decodeValue(encoded);
			expect(decoded).toEqual(original);
		});

		it("round-trips list", () => {
			const original = [
				new Uint8Array([0x01]),
				new Uint8Array([0x02]),
				new Uint8Array([0x03]),
			];
			const encoded = encode(original);
			const decoded = decodeValue(encoded);
			expect(decoded).toEqual(original);
		});

		it("round-trips nested structure", () => {
			const original = [
				new Uint8Array([0x01]),
				[new Uint8Array([0x02]), new Uint8Array([0x03])],
			];
			const encoded = encode(original);
			const decoded = decodeValue(encoded);
			expect(decoded).toEqual(original);
		});

		it("round-trips long string (56+ bytes)", () => {
			const original = new Uint8Array(100).fill(0xff);
			const encoded = encode(original);
			const decoded = decodeValue(encoded);
			expect(decoded).toEqual(original);
		});
	});

	describe("error handling", () => {
		it("throws RlpDecodingError on empty input", () => {
			expect(() => decodeValue(new Uint8Array([]))).toThrow(RlpDecodingError);
		});

		it("throws RlpDecodingError on truncated input", () => {
			// Claims 3 bytes but only has 2
			const input = new Uint8Array([0x83, 1, 2]);
			expect(() => decodeValue(input)).toThrow(RlpDecodingError);
		});

		it("throws on unexpected remainder (non-stream mode)", () => {
			// Two separate values - second is remainder
			const input = new Uint8Array([0x01, 0x02]);
			expect(() => decodeValue(input)).toThrow(RlpDecodingError);
		});
	});

	describe("comparison with decode() behavior", () => {
		it("decodeValue returns raw value, decode returns wrapped object", async () => {
			const { decode } = await import("./decode.js");
			const input = new Uint8Array([0x83, 1, 2, 3]);

			// decode() returns { data: { type, value }, remainder }
			const decodeResult = decode(input);
			expect(decodeResult).toHaveProperty("data");
			expect(decodeResult).toHaveProperty("remainder");
			expect(decodeResult.data).toHaveProperty("type");
			expect(decodeResult.data).toHaveProperty("value");

			// decodeValue() returns the value directly
			const decodeValueResult = decodeValue(input);
			expect(decodeValueResult).toBeInstanceOf(Uint8Array);
			expect(decodeValueResult).toEqual(new Uint8Array([1, 2, 3]));
		});
	});
});
