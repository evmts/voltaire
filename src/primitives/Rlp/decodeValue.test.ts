import { describe, expect, it } from "vitest";
import { decodeValue, encode, from, decode } from "./internal-index.js";
import { RlpDecodingError } from "./RlpError.js";

describe("decodeValue", () => {
	describe("bytes decoding", () => {
		it("decodes single byte (0x00-0x7f)", () => {
			const encoded = encode(from(new Uint8Array([0x42])));
			const value = decodeValue(encoded);
			expect(value).toBeInstanceOf(Uint8Array);
			expect(value).toEqual(new Uint8Array([0x42]));
		});

		it("decodes short bytes (1-55 bytes)", () => {
			const input = new Uint8Array([1, 2, 3]);
			const encoded = encode(from(input));
			const value = decodeValue(encoded);
			expect(value).toEqual(input);
		});

		it("decodes long bytes (>55 bytes)", () => {
			const input = new Uint8Array(100).fill(0xaa);
			const encoded = encode(from(input));
			const value = decodeValue(encoded);
			expect(value).toEqual(input);
		});

		it("decodes empty bytes", () => {
			const encoded = new Uint8Array([0x80]);
			const value = decodeValue(encoded);
			expect(value).toEqual(new Uint8Array([]));
		});
	});

	describe("list decoding", () => {
		it("decodes simple list", () => {
			const encoded = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
			const value = decodeValue(encoded);
			expect(Array.isArray(value)).toBe(true);
			expect(value).toHaveLength(3);
			expect(value[0]).toEqual(new Uint8Array([0x01]));
			expect(value[1]).toEqual(new Uint8Array([0x02]));
			expect(value[2]).toEqual(new Uint8Array([0x03]));
		});

		it("decodes empty list", () => {
			const encoded = new Uint8Array([0xc0]);
			const value = decodeValue(encoded);
			expect(Array.isArray(value)).toBe(true);
			expect(value).toHaveLength(0);
		});

		it("decodes nested list", () => {
			// [[1, 2], [3]]
			const inner1 = from([from(new Uint8Array([1])), from(new Uint8Array([2]))]);
			const inner2 = from([from(new Uint8Array([3]))]);
			const outer = from([inner1, inner2]);
			const encoded = encode(outer);
			const value = decodeValue(encoded);

			expect(Array.isArray(value)).toBe(true);
			expect(value).toHaveLength(2);
			expect(Array.isArray(value[0])).toBe(true);
			expect(Array.isArray(value[1])).toBe(true);
			expect(value[0]).toHaveLength(2);
			expect(value[1]).toHaveLength(1);
		});
	});

	describe("comparison with decode()", () => {
		it("returns value directly instead of wrapped object", () => {
			const input = new Uint8Array([1, 2, 3]);
			const encoded = encode(from(input));

			// decode() returns { data: { type, value }, remainder }
			const fullResult = decode(encoded);
			expect(fullResult).toHaveProperty("data");
			expect(fullResult).toHaveProperty("remainder");
			expect(fullResult.data).toHaveProperty("type", "bytes");
			expect(fullResult.data).toHaveProperty("value");

			// decodeValue() returns value directly
			const value = decodeValue(encoded);
			expect(value).toEqual(input);
			expect(value).not.toHaveProperty("data");
			expect(value).not.toHaveProperty("remainder");
		});
	});

	describe("error handling", () => {
		it("throws on empty input", () => {
			expect(() => decodeValue(new Uint8Array([]))).toThrow(RlpDecodingError);
		});

		it("throws on extra data after value", () => {
			// Valid RLP byte followed by extra data
			const withExtra = new Uint8Array([0x01, 0x02]);
			expect(() => decodeValue(withExtra)).toThrow(RlpDecodingError);
		});

		it("throws on truncated data", () => {
			// Says 3 bytes but only has 2
			const truncated = new Uint8Array([0x83, 0x01, 0x02]);
			expect(() => decodeValue(truncated)).toThrow(RlpDecodingError);
		});
	});
});
