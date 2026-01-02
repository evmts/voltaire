/**
 * Comprehensive edge case tests for RLP encoding/decoding
 */

import { describe, expect, it } from "vitest";
import { MAX_DEPTH } from "./constants.js";
import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { RlpDecodingError } from "./RlpError.js";

describe("RLP edge cases - boundary values", () => {
	it("handles single byte at 0x7f/0x80 boundary", () => {
		const byte7f = new Uint8Array([0x7f]);
		const encoded7f = encode(byte7f);
		expect(encoded7f).toEqual(new Uint8Array([0x7f])); // Single byte

		const byte80 = new Uint8Array([0x80]);
		const encoded80 = encode(byte80);
		expect(encoded80).toEqual(new Uint8Array([0x81, 0x80])); // Short string

		const decoded7f = decode(encoded7f);
		const decoded80 = decode(encoded80);
		// biome-ignore lint/suspicious/noExplicitAny: accessing decoded RLP value
		expect((decoded7f.data as any).value).toEqual(byte7f);
		// biome-ignore lint/suspicious/noExplicitAny: accessing decoded RLP value
		expect((decoded80.data as any).value).toEqual(byte80);
	});

	it("handles 55-byte boundary (short vs long string)", () => {
		const bytes55 = new Uint8Array(55).fill(0xff);
		const bytes56 = new Uint8Array(56).fill(0xff);

		const encoded55 = encode(bytes55);
		const encoded56 = encode(bytes56);

		// 55 bytes uses short form: 0x80 + 55 = 0xb7
		expect(encoded55[0]).toBe(0xb7);
		expect(encoded55.length).toBe(56); // 1 prefix + 55 data

		// 56 bytes uses long form: 0xb7 + 1 = 0xb8
		expect(encoded56[0]).toBe(0xb8);
		expect(encoded56.length).toBe(58); // 1 prefix + 1 length + 56 data

		// Round-trip
		const decoded55 = decode(encoded55);
		const decoded56 = decode(encoded56);
		// biome-ignore lint/suspicious/noExplicitAny: accessing decoded RLP value
		expect((decoded55.data as any).value).toEqual(bytes55);
		// biome-ignore lint/suspicious/noExplicitAny: accessing decoded RLP value
		expect((decoded56.data as any).value).toEqual(bytes56);
	});

	it("handles 55-item list boundary", () => {
		const items55 = Array.from({ length: 55 }, () => new Uint8Array([0x01]));
		const items56 = Array.from({ length: 56 }, () => new Uint8Array([0x01]));

		const encoded55 = encode(items55);
		const encoded56 = encode(items56);

		// Should use appropriate form
		expect(encoded55[0]).toBeLessThanOrEqual(0xf7);
		expect(encoded56[0]).toBeGreaterThanOrEqual(0xf8);

		// Round-trip
		const decoded55 = decode(encoded55);
		const decoded56 = decode(encoded56);
		expect(decoded55.data.type).toBe("list");
		expect(decoded56.data.type).toBe("list");
	});

	it("distinguishes empty string vs empty list", () => {
		const emptyBytes = new Uint8Array([]);
		// biome-ignore lint/suspicious/noExplicitAny: empty array for RLP test
		const emptyList: any[] = [];

		const encodedBytes = encode(emptyBytes);
		const encodedList = encode(emptyList);

		expect(encodedBytes).toEqual(new Uint8Array([0x80])); // Empty bytes
		expect(encodedList).toEqual(new Uint8Array([0xc0])); // Empty list

		const decodedBytes = decode(encodedBytes);
		const decodedList = decode(encodedList);

		expect(decodedBytes.data.type).toBe("bytes");
		expect(decodedList.data.type).toBe("list");
	});
});

describe("RLP edge cases - deeply nested structures", () => {
	it("handles 10-level nested lists", () => {
		// biome-ignore lint/suspicious/noExplicitAny: building deeply nested structure
		let nested: any = new Uint8Array([0x01]);
		for (let i = 0; i < 10; i++) {
			nested = [nested];
		}

		const encoded = encode(nested);
		const decoded = decode(encoded);

		// Verify structure
		let current = decoded.data;
		for (let i = 0; i < 10; i++) {
			expect(current.type).toBe("list");
			if (current.type === "list") {
				// biome-ignore lint/suspicious/noExplicitAny: traversing nested structure
				current = current.value[0] as any;
			}
		}
		expect(current.type).toBe("bytes");
		if (current.type === "bytes") {
			expect(current.value).toEqual(new Uint8Array([0x01]));
		}
	});

	it("throws on maximum recursion depth exceeded", () => {
		// Create deeply nested list exceeding MAX_DEPTH
		let nested = new Uint8Array([0x01]);
		for (let i = 0; i < MAX_DEPTH + 1; i++) {
			const prefix = nested.length < 56 ? 0xc0 + nested.length : 0xf7;
			nested = new Uint8Array([prefix, ...nested]);
		}

		expect(() => decode(nested)).toThrow(RlpDecodingError);
		expect(() => decode(nested)).toThrow(/depth/i);
	});
});

describe("RLP edge cases - large data", () => {
	it("handles 1MB+ string", () => {
		const largeData = new Uint8Array(1024 * 1024).fill(0xab);
		const encoded = encode(largeData);
		const decoded = decode(encoded);

		expect(decoded.data.type).toBe("bytes");
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value.length).toBe(1024 * 1024);
			expect(decoded.data.value[0]).toBe(0xab);
		}
	});

	it("handles 1000+ element list", () => {
		const items = Array.from(
			{ length: 1000 },
			(_, i) => new Uint8Array([i % 256]),
		);
		const encoded = encode(items);
		const decoded = decode(encoded);

		expect(decoded.data.type).toBe("list");
		if (decoded.data.type === "list") {
			expect(decoded.data.value.length).toBe(1000);
			for (let i = 0; i < 1000; i++) {
				const item = decoded.data.value[i];
				if (item?.type === "bytes") {
					expect(item.value).toEqual(new Uint8Array([i % 256]));
				}
			}
		}
	});

	it("handles 256+ byte length prefix", () => {
		// Length 256 = 0x0100, needs 2 bytes
		const data = new Uint8Array(256).fill(0xff);
		const encoded = encode(data);

		expect(encoded[0]).toBe(0xb9); // 0xb7 + 2
		expect(encoded[1]).toBe(0x01); // High byte
		expect(encoded[2]).toBe(0x00); // Low byte

		const decoded = decode(encoded);
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value.length).toBe(256);
		}
	});

	it("handles 65536+ byte length prefix", () => {
		// Length 65536 = 0x010000, needs 3 bytes
		const data = new Uint8Array(65536).fill(0xaa);
		const encoded = encode(data);

		expect(encoded[0]).toBe(0xba); // 0xb7 + 3
		expect(encoded[1]).toBe(0x01); // High byte
		expect(encoded[2]).toBe(0x00); // Mid byte
		expect(encoded[3]).toBe(0x00); // Low byte

		const decoded = decode(encoded);
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value.length).toBe(65536);
		}
	});
});

describe("RLP edge cases - malformed inputs", () => {
	it("rejects non-canonical single byte encoding", () => {
		// Single byte < 0x80 should encode as itself, not as short string
		const invalid = new Uint8Array([0x81, 0x7f]); // Should be just [0x7f]
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});

	it("rejects non-canonical empty string encoding", () => {
		// Empty string should be 0x80, not long form
		const invalid = new Uint8Array([0xb8, 0x00]); // Should be [0x80]
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});

	it("rejects non-canonical short string as long form", () => {
		// String < 56 bytes should use short form
		const invalid = new Uint8Array([0xb8, 10, ...new Uint8Array(10)]);
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});

	it("rejects leading zeros in length", () => {
		// Length encoding should be minimal (no leading zeros)
		const invalid = new Uint8Array([0xb9, 0x00, 0x3c, ...new Uint8Array(60)]);
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});

	it("rejects truncated data", () => {
		// Claims 10 bytes, only provides 5
		const invalid = new Uint8Array([0x8a, 1, 2, 3, 4, 5]);
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});

	it("rejects extra data after valid RLP (non-stream mode)", () => {
		// Valid RLP followed by extra byte
		const validWithExtra = new Uint8Array([0x01, 0x02]);
		expect(() => decode(validWithExtra, false)).toThrow(RlpDecodingError);
	});

	it("allows extra data in stream mode", () => {
		const validWithExtra = new Uint8Array([0x01, 0x02]);
		const result = decode(validWithExtra, true);
		expect(result.data.type).toBe("bytes");
		if (result.data.type === "bytes") {
			expect(result.data.value).toEqual(new Uint8Array([0x01]));
		}
		expect(result.remainder).toEqual(new Uint8Array([0x02]));
	});

	it("rejects list with mismatched length", () => {
		// Claims list length 5, but content is only 2 bytes
		const invalid = new Uint8Array([0xc5, 0x01, 0x02]);
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});

	it("rejects incomplete nested list", () => {
		// Outer list claims 3 bytes, inner list incomplete
		const invalid = new Uint8Array([0xc3, 0xc2, 0x01]); // Inner list needs 2 bytes, has 1
		expect(() => decode(invalid)).toThrow(RlpDecodingError);
	});
});

describe("RLP edge cases - special values", () => {
	it("handles zero byte", () => {
		const zero = new Uint8Array([0x00]);
		const encoded = encode(zero);
		expect(encoded).toEqual(new Uint8Array([0x00])); // Single byte < 0x80
		const decoded = decode(encoded);
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value).toEqual(zero);
		}
	});

	it("handles all single byte values [0x00-0x7f]", () => {
		for (let i = 0; i <= 0x7f; i++) {
			const byte = new Uint8Array([i]);
			const encoded = encode(byte);
			expect(encoded).toEqual(new Uint8Array([i]));
			const decoded = decode(encoded);
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(byte);
			}
		}
	});

	it("handles all single byte values [0x80-0xff]", () => {
		for (let i = 0x80; i <= 0xff; i++) {
			const byte = new Uint8Array([i]);
			const encoded = encode(byte);
			expect(encoded).toEqual(new Uint8Array([0x81, i]));
			const decoded = decode(encoded);
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(byte);
			}
		}
	});

	it("handles list of all empty elements", () => {
		const items = Array.from({ length: 10 }, () => new Uint8Array([]));
		const encoded = encode(items);
		const decoded = decode(encoded);

		if (decoded.data.type === "list") {
			expect(decoded.data.value.length).toBe(10);
			for (const item of decoded.data.value) {
				expect(item.type).toBe("bytes");
				if (item.type === "bytes") {
					expect(item.value).toEqual(new Uint8Array([]));
				}
			}
		}
	});

	it("handles alternating bytes and lists", () => {
		const items = [
			new Uint8Array([0x01]),
			[new Uint8Array([0x02])],
			new Uint8Array([0x03]),
			[new Uint8Array([0x04])],
			new Uint8Array([0x05]),
		];

		const encoded = encode(items);
		const decoded = decode(encoded);

		if (decoded.data.type === "list") {
			expect(decoded.data.value.length).toBe(5);
			expect(decoded.data.value[0]?.type).toBe("bytes");
			expect(decoded.data.value[1]?.type).toBe("list");
			expect(decoded.data.value[2]?.type).toBe("bytes");
			expect(decoded.data.value[3]?.type).toBe("list");
			expect(decoded.data.value[4]?.type).toBe("bytes");
		}
	});
});
