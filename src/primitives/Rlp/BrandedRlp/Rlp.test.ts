/**
 * Tests for RLP module
 */

import { describe, expect, it } from "vitest";
import type { BrandedRlp } from "./BrandedRlp.js";
import * as Data from "./Data.js";
import { MAX_DEPTH } from "./constants.js";
import { decode } from "./decode.js";
import type { Encodable } from "./encode.js";
import { encode } from "./encode.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { equals } from "./equals.js";
import { RlpEncodingError, RlpDecodingError } from "./RlpError.js";
import { flatten } from "./flatten.js";
import { fromJSON } from "./fromJSON.js";
import { getEncodedLength } from "./getEncodedLength.js";
import { isBytesData } from "./isBytesData.js";
import { isData } from "./isData.js";
import { isListData } from "./isListData.js";
import { toJSON } from "./toJSON.js";

// Create Rlp namespace for compatibility with tests
const Rlp = {
	encode,
	encodeBytes,
	encodeList,
	decode,
	isData,
	isBytesData,
	isListData,
	getEncodedLength,
	flatten,
	equals,
	toJSON,
	fromJSON,
	EncodingError: RlpEncodingError,
	DecodingError: RlpDecodingError,
	MAX_DEPTH,
} as const;

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("Rlp type guards", () => {
	it("isData identifies valid Data structures", () => {
		const bytesData = { type: "bytes", value: new Uint8Array([1, 2, 3]) };
		const listData = { type: "list", value: [] };

		expect(Rlp.isData(bytesData)).toBe(true);
		expect(Rlp.isData(listData)).toBe(true);
		expect(Rlp.isData({})).toBe(false);
		expect(Rlp.isData(null)).toBe(false);
		expect(Rlp.isData(undefined)).toBe(false);
		expect(Rlp.isData("invalid")).toBe(false);
	});

	it("isBytesData identifies bytes Data", () => {
		const bytesData = { type: "bytes", value: new Uint8Array() };
		const listData = { type: "list", value: [] };

		expect(Rlp.isBytesData(bytesData)).toBe(true);
		expect(Rlp.isBytesData(listData)).toBe(false);
	});

	it("isListData identifies list Data", () => {
		const bytesData = { type: "bytes", value: new Uint8Array() };
		const listData = { type: "list", value: [] };

		expect(Rlp.isListData(bytesData)).toBe(false);
		expect(Rlp.isListData(listData)).toBe(true);
	});
});

// ============================================================================
// Encoding Tests - Bytes
// ============================================================================

describe("Rlp.encodeBytes", () => {
	it("encodes single byte < 0x80 as itself", () => {
		const input = new Uint8Array([0x7f]);
		const result = Rlp.encodeBytes(input);
		expect(result).toEqual(new Uint8Array([0x7f]));
	});

	it("encodes single byte >= 0x80 with prefix", () => {
		const input = new Uint8Array([0x80]);
		const result = Rlp.encodeBytes(input);
		expect(result).toEqual(new Uint8Array([0x81, 0x80]));
	});

	it("encodes empty bytes", () => {
		const input = new Uint8Array([]);
		const result = Rlp.encodeBytes(input);
		expect(result).toEqual(new Uint8Array([0x80]));
	});

	it("encodes short string (< 56 bytes)", () => {
		const input = new Uint8Array([1, 2, 3]);
		const result = Rlp.encodeBytes(input);
		expect(result).toEqual(new Uint8Array([0x83, 1, 2, 3]));
	});

	it("encodes string at 55 bytes boundary", () => {
		const input = new Uint8Array(55).fill(0x42);
		const result = Rlp.encodeBytes(input);
		expect(result.length).toBe(56);
		expect(result[0]).toBe(0x80 + 55);
	});

	it("encodes long string (56+ bytes)", () => {
		const input = new Uint8Array(60).fill(0x42);
		const result = Rlp.encodeBytes(input);
		// 0xb8 = 0xb7 + 1 (length of length)
		// 0x3c = 60 in hex
		expect(result[0]).toBe(0xb8);
		expect(result[1]).toBe(60);
		expect(result.length).toBe(62); // 1 prefix + 1 length + 60 data
	});

	it("encodes very long string (256+ bytes)", () => {
		const input = new Uint8Array(300).fill(0xff);
		const result = Rlp.encodeBytes(input);
		// Length 300 = 0x012c, needs 2 bytes
		expect(result[0]).toBe(0xb9); // 0xb7 + 2
		expect(result[1]).toBe(0x01); // High byte of 300
		expect(result[2]).toBe(0x2c); // Low byte of 300
		expect(result.length).toBe(303);
	});
});

// ============================================================================
// Encoding Tests - Lists
// ============================================================================

describe("Rlp.encodeList", () => {
	it("encodes empty list", () => {
		const input: Encodable[] = [];
		const result = Rlp.encodeList(input);
		expect(result).toEqual(new Uint8Array([0xc0]));
	});

	it("encodes list with single item", () => {
		const input = [new Uint8Array([0x01])];
		const result = Rlp.encodeList(input);
		// [0x01] -> 0xc1, 0x01 (list with 1 byte payload)
		// 0x01 encodes as itself (single byte < 0x80)
		expect(result).toEqual(new Uint8Array([0xc1, 0x01]));
	});

	it("encodes list with multiple items", () => {
		const input = [new Uint8Array([0x01]), new Uint8Array([0x02])];
		const result = Rlp.encodeList(input);
		// Each item encodes as itself (< 0x80), so 2 bytes total
		expect(result).toEqual(new Uint8Array([0xc2, 0x01, 0x02]));
	});

	it("encodes list with empty bytes", () => {
		const input = [new Uint8Array([])];
		const result = Rlp.encodeList(input);
		expect(result).toEqual(new Uint8Array([0xc1, 0x80]));
	});

	it("encodes nested list", () => {
		const input = [new Uint8Array([0x01]), [new Uint8Array([0x02])]];
		const result = Rlp.encodeList(input);
		// Outer list: [0x01, [0x02]]
		// 0x01 encodes as itself = 1 byte
		// Inner [0x02] encodes as 0xc1, 0x02 = 2 bytes
		// Outer list length = 1 + 2 = 3
		expect(result).toEqual(new Uint8Array([0xc3, 0x01, 0xc1, 0x02]));
	});

	it("encodes deeply nested lists", () => {
		const input = [[[new Uint8Array([0x01])]]];
		const result = Rlp.encodeList(input);
		// [[[0x01]]] -> [[[0x01]]]
		// [0x01] -> 0xc1, 0x01 (list with 1 byte)
		// [[0x01]] -> 0xc2, 0xc1, 0x01 (list with 2 bytes)
		// [[[0x01]]] -> 0xc3, 0xc2, 0xc1, 0x01 (list with 3 bytes)
		expect(result).toEqual(new Uint8Array([0xc3, 0xc2, 0xc1, 0x01]));
	});

	it("encodes long list (56+ bytes total)", () => {
		// Create list with many items to exceed 55 bytes
		// Each item encodes as 0x01 (single byte < 0x80)
		// Total payload = 30 bytes
		// But we need > 55, so add more items
		const longItems = Array.from({ length: 60 }, () => new Uint8Array([0x01]));
		const longResult = Rlp.encodeList(longItems);
		expect(longResult[0]).toBeGreaterThanOrEqual(0xf8);
	});
});

// ============================================================================
// Encoding Tests - Generic encode()
// ============================================================================

describe("Rlp.encode", () => {
	it("encodes Uint8Array", () => {
		const input = new Uint8Array([1, 2, 3]);
		const result = Rlp.encode(input);
		expect(result).toEqual(new Uint8Array([0x83, 1, 2, 3]));
	});

	it("encodes bytes Data", () => {
		const input: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const result = Rlp.encode(input);
		expect(result).toEqual(new Uint8Array([0x83, 1, 2, 3]));
	});

	it("encodes list Data", () => {
		const input: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([0x01]) },
				{ type: "bytes", value: new Uint8Array([0x02]) },
			],
		};
		const result = Rlp.encode(input);
		expect(result).toEqual(new Uint8Array([0xc2, 0x01, 0x02]));
	});

	it("encodes array as list", () => {
		const input = [new Uint8Array([0x01]), new Uint8Array([0x02])];
		const result = Rlp.encode(input);
		expect(result).toEqual(new Uint8Array([0xc2, 0x01, 0x02]));
	});

	it("throws on invalid input type", () => {
		expect(() => Rlp.encode("invalid" as any)).toThrow(Rlp.Error);
		expect(() => Rlp.encode(123 as any)).toThrow(Rlp.Error);
	});
});

// ============================================================================
// Decoding Tests - Single Bytes
// ============================================================================

describe("Rlp.decode - bytes", () => {
	it("decodes single byte < 0x80", () => {
		const input = new Uint8Array([0x7f]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "bytes",
			value: new Uint8Array([0x7f]),
		});
		expect(result.remainder).toEqual(new Uint8Array([]));
	});

	it("decodes empty bytes", () => {
		const input = new Uint8Array([0x80]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "bytes",
			value: new Uint8Array([]),
		});
	});

	it("decodes short string", () => {
		const input = new Uint8Array([0x83, 1, 2, 3]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		});
	});

	it("decodes long string", () => {
		const payload = new Uint8Array(60).fill(0x42);
		const input = new Uint8Array([0xb8, 60, ...payload]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "bytes",
			value: payload,
		});
	});

	it("throws on empty input", () => {
		expect(() => Rlp.decode(new Uint8Array([]))).toThrow(Rlp.Error);
	});

	it("throws on truncated short string", () => {
		const input = new Uint8Array([0x83, 1, 2]); // Claims 3 bytes, has 2
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});

	it("throws on truncated long string", () => {
		const input = new Uint8Array([0xb8, 60, 1, 2, 3]); // Claims 60 bytes, has 3
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});

	it("throws on non-canonical single byte encoding", () => {
		const input = new Uint8Array([0x81, 0x7f]); // Should be just 0x7f
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});

	it("throws on non-canonical long form", () => {
		const input = new Uint8Array([0xb8, 10, ...new Uint8Array(10)]); // < 56 should use short form
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});

	it("throws on leading zeros in length", () => {
		const input = new Uint8Array([0xb8, 0x00, 0x3c, ...new Uint8Array(60)]); // Leading zero
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});
});

// ============================================================================
// Decoding Tests - Lists
// ============================================================================

describe("Rlp.decode - lists", () => {
	it("decodes empty list", () => {
		const input = new Uint8Array([0xc0]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "list",
			value: [],
		});
	});

	it("decodes single item list", () => {
		const input = new Uint8Array([0xc1, 0x01]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([0x01]) }],
		});
	});

	it("decodes multi-item list", () => {
		const input = new Uint8Array([0xc2, 0x01, 0x02]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([0x01]) },
				{ type: "bytes", value: new Uint8Array([0x02]) },
			],
		});
	});

	it("decodes nested list", () => {
		const input = new Uint8Array([0xc3, 0x01, 0xc1, 0x02]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([0x01]) },
				{
					type: "list",
					value: [{ type: "bytes", value: new Uint8Array([0x02]) }],
				},
			],
		});
	});

	it("decodes deeply nested lists", () => {
		const input = new Uint8Array([0xc3, 0xc2, 0xc1, 0x01]);
		const result = Rlp.decode(input);
		expect(result.data).toEqual({
			type: "list",
			value: [
				{
					type: "list",
					value: [
						{
							type: "list",
							value: [{ type: "bytes", value: new Uint8Array([0x01]) }],
						},
					],
				},
			],
		});
	});

	it("throws on truncated list", () => {
		const input = new Uint8Array([0xc4, 0x01]); // Claims 4 bytes, has 1
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});

	it("throws on list with mismatched length", () => {
		const input = new Uint8Array([0xc5, 0x01, 0x02]); // Claims 5 bytes, has 2
		expect(() => Rlp.decode(input)).toThrow(Rlp.Error);
	});

	it("throws on maximum recursion depth", () => {
		// Create deeply nested list exceeding MAX_DEPTH
		let nested = new Uint8Array([0x01]);
		for (let i = 0; i < Rlp.MAX_DEPTH + 1; i++) {
			const prefix = nested.length < 56 ? 0xc0 + nested.length : 0xf7;
			nested = new Uint8Array([prefix, ...nested]);
		}
		expect(() => Rlp.decode(nested)).toThrow(Rlp.Error);
	});
});

// ============================================================================
// Stream Decoding Tests
// ============================================================================

describe("Rlp.decode - stream mode", () => {
	it("decodes with remainder in stream mode", () => {
		const input = new Uint8Array([0x01, 0x02]);
		const result = Rlp.decode(input, true);
		expect(result.data).toEqual({
			type: "bytes",
			value: new Uint8Array([0x01]),
		});
		expect(result.remainder).toEqual(new Uint8Array([0x02]));
	});

	it("throws on remainder in non-stream mode", () => {
		const input = new Uint8Array([0x01, 0x02]);
		expect(() => Rlp.decode(input, false)).toThrow(Rlp.Error);
	});

	it("allows exact match in non-stream mode", () => {
		const input = new Uint8Array([0x01]);
		const result = Rlp.decode(input, false);
		expect(result.data).toEqual({
			type: "bytes",
			value: new Uint8Array([0x01]),
		});
		expect(result.remainder).toEqual(new Uint8Array([]));
	});
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe("Rlp round-trip encoding/decoding", () => {
	it("round-trips single byte", () => {
		const original = new Uint8Array([0x42]);
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("bytes");
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value).toEqual(original);
		}
	});

	it("round-trips short string", () => {
		const original = new Uint8Array([1, 2, 3, 4, 5]);
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("bytes");
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value).toEqual(original);
		}
	});

	it("round-trips long string", () => {
		const original = new Uint8Array(200).fill(0xaa);
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("bytes");
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value).toEqual(original);
		}
	});

	it("round-trips empty list", () => {
		const original: Encodable[] = [];
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data).toEqual({ type: "list", value: [] });
	});

	it("round-trips simple list", () => {
		const original = [new Uint8Array([0x01]), new Uint8Array([0x02])];
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([0x01]) },
				{ type: "bytes", value: new Uint8Array([0x02]) },
			],
		});
	});

	it("round-trips nested list", () => {
		const original = [new Uint8Array([0x01]), [new Uint8Array([0x02])]];
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([0x01]) },
				{
					type: "list",
					value: [{ type: "bytes", value: new Uint8Array([0x02]) }],
				},
			],
		});
	});

	it("round-trips complex nested structure", () => {
		const original = [
			new Uint8Array([0x01]),
			[new Uint8Array([0x02]), new Uint8Array([0x03])],
			[[new Uint8Array([0x04])]],
		];
		const encoded = Rlp.encode(original);
		const decoded = Rlp.decode(encoded);
		const expected: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([0x01]) },
				{
					type: "list",
					value: [
						{ type: "bytes", value: new Uint8Array([0x02]) },
						{ type: "bytes", value: new Uint8Array([0x03]) },
					],
				},
				{
					type: "list",
					value: [
						{
							type: "list",
							value: [{ type: "bytes", value: new Uint8Array([0x04]) }],
						},
					],
				},
			],
		};
		expect(decoded.data).toEqual(expected);
	});
});

// ============================================================================
// Data Namespace Tests
// ============================================================================

describe("Rlp.Data namespace", () => {
	it("fromBytes creates bytes Data", () => {
		const bytes = new Uint8Array([1, 2, 3]);
		const data = Data.fromBytes(bytes);
		expect(data).toEqual({ type: "bytes", value: bytes });
	});

	it("fromList creates list Data", () => {
		const items: BrandedRlp[] = [
			{ type: "bytes", value: new Uint8Array([1]) },
			{ type: "bytes", value: new Uint8Array([2]) },
		];
		const data = Data.fromList(items);
		expect(data).toEqual({ type: "list", value: items });
	});

	it("encode encodes Data", () => {
		const data: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const encoded = Data.encodeData(data);
		expect(encoded).toEqual(new Uint8Array([0x83, 1, 2, 3]));
	});

	it("toBytes extracts bytes value", () => {
		const bytesData: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const listData: BrandedRlp = { type: "list", value: [] };
		expect(Data.toBytes(bytesData)).toEqual(new Uint8Array([1, 2, 3]));
		expect(Data.toBytes(listData)).toBeUndefined();
	});

	it("toList extracts list value", () => {
		const bytesData: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const listData: BrandedRlp = {
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([1]) }],
		};
		expect(Data.toList(bytesData)).toBeUndefined();
		expect(Data.toList(listData)).toEqual(listData.value);
	});
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe("Rlp.getEncodedLength", () => {
	it("calculates length for single byte < 0x80", () => {
		const input = new Uint8Array([0x7f]);
		expect(Rlp.getEncodedLength(input)).toBe(1);
	});

	it("calculates length for short string", () => {
		const input = new Uint8Array([1, 2, 3]);
		expect(Rlp.getEncodedLength(input)).toBe(4); // 1 prefix + 3 bytes
	});

	it("calculates length for long string", () => {
		const input = new Uint8Array(60);
		expect(Rlp.getEncodedLength(input)).toBe(62); // 1 prefix + 1 length + 60 bytes
	});

	it("calculates length for list", () => {
		const input = [new Uint8Array([0x01]), new Uint8Array([0x02])];
		expect(Rlp.getEncodedLength(input)).toBe(3); // 1 prefix + 2 items

		// Verify against actual encoding
		const encoded = Rlp.encode(input);
		expect(Rlp.getEncodedLength(input)).toBe(encoded.length);
	});

	it("calculates length for Data structures", () => {
		const bytesData: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const listData: BrandedRlp = {
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([1]) }],
		};
		expect(Rlp.getEncodedLength(bytesData)).toBe(4);
		expect(Rlp.getEncodedLength(listData)).toBe(2);
	});
});

describe("Rlp.flatten", () => {
	it("flattens nested list to bytes array", () => {
		const nested: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{
					type: "list",
					value: [
						{ type: "bytes", value: new Uint8Array([2]) },
						{ type: "bytes", value: new Uint8Array([3]) },
					],
				},
			],
		};
		const flat = Rlp.flatten(nested);
		expect(flat).toEqual([
			{ type: "bytes", value: new Uint8Array([1]) },
			{ type: "bytes", value: new Uint8Array([2]) },
			{ type: "bytes", value: new Uint8Array([3]) },
		]);
	});

	it("flattens bytes Data as single item", () => {
		const bytesData: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const flat = Rlp.flatten(bytesData);
		expect(flat).toEqual([{ type: "bytes", value: new Uint8Array([1, 2, 3]) }]);
	});

	it("flattens empty list", () => {
		const emptyList: BrandedRlp = { type: "list", value: [] };
		const flat = Rlp.flatten(emptyList);
		expect(flat).toEqual([]);
	});
});

describe("Rlp.equals", () => {
	it("compares equal bytes Data", () => {
		const a: BrandedRlp = { type: "bytes", value: new Uint8Array([1, 2, 3]) };
		const b: BrandedRlp = { type: "bytes", value: new Uint8Array([1, 2, 3]) };
		expect(Rlp.equals(a, b)).toBe(true);
	});

	it("compares unequal bytes Data", () => {
		const a: BrandedRlp = { type: "bytes", value: new Uint8Array([1, 2, 3]) };
		const b: BrandedRlp = { type: "bytes", value: new Uint8Array([1, 2, 4]) };
		expect(Rlp.equals(a, b)).toBe(false);
	});

	it("compares equal list Data", () => {
		const a: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{ type: "bytes", value: new Uint8Array([2]) },
			],
		};
		const b: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{ type: "bytes", value: new Uint8Array([2]) },
			],
		};
		expect(Rlp.equals(a, b)).toBe(true);
	});

	it("compares unequal list Data", () => {
		const a: BrandedRlp = {
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([1]) }],
		};
		const b: BrandedRlp = {
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([2]) }],
		};
		expect(Rlp.equals(a, b)).toBe(false);
	});

	it("compares different types", () => {
		const a: BrandedRlp = { type: "bytes", value: new Uint8Array([1]) };
		const b: BrandedRlp = {
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([1]) }],
		};
		expect(Rlp.equals(a, b)).toBe(false);
	});
});

describe("Rlp.toJSON and fromJSON", () => {
	it("converts bytes Data to JSON and back", () => {
		const data: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const json = Rlp.toJSON(data);
		expect(json).toEqual({ type: "bytes", value: [1, 2, 3] });
		const restored = Rlp.fromJSON(json);
		expect(restored).toEqual(data);
	});

	it("converts list Data to JSON and back", () => {
		const data: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{ type: "bytes", value: new Uint8Array([2]) },
			],
		};
		const json = Rlp.toJSON(data);
		const restored = Rlp.fromJSON(json);
		expect(restored).toEqual(data);
	});

	it("converts nested list Data to JSON and back", () => {
		const data: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{
					type: "list",
					value: [{ type: "bytes", value: new Uint8Array([2]) }],
				},
			],
		};
		const json = Rlp.toJSON(data);
		const restored = Rlp.fromJSON(json);
		expect(restored).toEqual(data);
	});

	it("throws on invalid JSON format", () => {
		expect(() => Rlp.fromJSON(null)).toThrow(Rlp.Error);
		expect(() => Rlp.fromJSON("invalid")).toThrow(Rlp.Error);
		expect(() => Rlp.fromJSON({})).toThrow(Rlp.Error);
		expect(() => Rlp.fromJSON({ type: "invalid" })).toThrow(Rlp.Error);
	});
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe("Rlp edge cases", () => {
	it("handles zero byte", () => {
		const input = new Uint8Array([0x00]);
		const encoded = Rlp.encode(input);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data).toEqual({
			type: "bytes",
			value: new Uint8Array([0x00]),
		});
	});

	it("handles max single byte value (0x7f)", () => {
		const input = new Uint8Array([0x7f]);
		const encoded = Rlp.encode(input);
		expect(encoded).toEqual(new Uint8Array([0x7f]));
		const decoded = Rlp.decode(encoded);
		expect(decoded.data).toEqual({
			type: "bytes",
			value: new Uint8Array([0x7f]),
		});
	});

	it("handles boundary at 56 bytes", () => {
		const input55 = new Uint8Array(55).fill(0xff);
		const input56 = new Uint8Array(56).fill(0xff);

		const encoded55 = Rlp.encode(input55);
		expect(encoded55[0]).toBe(0x80 + 55); // Short form

		const encoded56 = Rlp.encode(input56);
		expect(encoded56[0]).toBe(0xb8); // Long form

		const decoded55 = Rlp.decode(encoded55);
		const decoded56 = Rlp.decode(encoded56);
		expect(decoded55.data.type).toBe("bytes");
		expect(decoded56.data.type).toBe("bytes");
		if (decoded55.data.type === "bytes") {
			expect(decoded55.data.value).toEqual(input55);
		}
		if (decoded56.data.type === "bytes") {
			expect(decoded56.data.value).toEqual(input56);
		}
	});

	it("handles very large data", () => {
		const input = new Uint8Array(10000).fill(0xab);
		const encoded = Rlp.encode(input);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("bytes");
		if (decoded.data.type === "bytes") {
			expect(decoded.data.value.length).toBe(10000);
			expect(decoded.data.value).toEqual(input);
		}
	});

	it("handles list of empty bytes", () => {
		const input = [new Uint8Array([]), new Uint8Array([]), new Uint8Array([])];
		const encoded = Rlp.encode(input);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([]) },
				{ type: "bytes", value: new Uint8Array([]) },
				{ type: "bytes", value: new Uint8Array([]) },
			],
		});
	});

	it("handles alternating bytes and lists", () => {
		const input = [
			new Uint8Array([0x01]),
			[new Uint8Array([0x02])],
			new Uint8Array([0x03]),
			[new Uint8Array([0x04])],
		];
		const encoded = Rlp.encode(input);
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("list");
		if (decoded.data.type === "list") {
			expect(decoded.data.value.length).toBe(4);
			expect(decoded.data.value[0]?.type).toBe("bytes");
			expect(decoded.data.value[1]?.type).toBe("list");
			expect(decoded.data.value[2]?.type).toBe("bytes");
			expect(decoded.data.value[3]?.type).toBe("list");
		}
	});
});

// ============================================================================
// Real-world Use Case Tests
// ============================================================================

describe("Rlp real-world use cases", () => {
	it("encodes Ethereum transaction data structure", () => {
		// Simplified transaction: [nonce, gasPrice, gasLimit, to, value, data]
		const nonce = new Uint8Array([0x09]);
		const gasPrice = new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]); // 20 Gwei
		const gasLimit = new Uint8Array([0x52, 0x08]); // 21000
		const to = new Uint8Array(20).fill(0x01); // Address
		const value = new Uint8Array([
			0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00,
		]); // 1 ETH
		const data = new Uint8Array([]);

		const tx = [nonce, gasPrice, gasLimit, to, value, data];
		const encoded = Rlp.encode(tx);

		// Should successfully encode without error
		expect(encoded.length).toBeGreaterThan(0);

		// Verify round-trip
		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("list");
		if (decoded.data.type === "list") {
			expect(decoded.data.value.length).toBe(6);
		}
	});

	it("encodes nested list structure (like transaction with access list)", () => {
		const simpleData = new Uint8Array([0x01, 0x02]);
		const address = new Uint8Array(20).fill(0xff);
		const storageKey = new Uint8Array(32).fill(0xaa);

		const accessList = [[address, [storageKey]]];
		const txWithAccessList = [simpleData, accessList];

		const encoded = Rlp.encode(txWithAccessList);
		expect(encoded.length).toBeGreaterThan(0);

		const decoded = Rlp.decode(encoded);
		expect(decoded.data.type).toBe("list");
	});

	it("handles string-like data (UTF-8 bytes)", () => {
		const text = "hello";
		const textBytes = new TextEncoder().encode(text);
		const encoded = Rlp.encode(textBytes);
		const decoded = Rlp.decode(encoded);

		expect(decoded.data.type).toBe("bytes");
		if (decoded.data.type === "bytes") {
			const decodedText = new TextDecoder().decode(decoded.data.value);
			expect(decodedText).toBe(text);
		}
	});
});

// ============================================================================
// Error Type Tests
// ============================================================================

describe("Rlp.Error types", () => {
	it("creates encoding error with correct properties", () => {
		const err = new Rlp.EncodingError("Test message", {
			code: "RLP_INVALID_TYPE",
		});
		expect(err.message).toContain("Test message");
		expect(err.code).toBe("RLP_INVALID_TYPE");
		expect(err.name).toBe("RlpEncodingError");
	});

	it("creates decoding error with correct properties", () => {
		const err = new Rlp.DecodingError("Test message", {
			code: "RLP_INPUT_TOO_SHORT",
		});
		expect(err.message).toContain("Test message");
		expect(err.code).toBe("RLP_INPUT_TOO_SHORT");
		expect(err.name).toBe("RlpDecodingError");
	});

	it("throws correct error types", () => {
		try {
			Rlp.decode(new Uint8Array([]));
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(Rlp.DecodingError);
			if (err instanceof RlpDecodingError) {
				expect(err.code).toBe("RLP_INPUT_TOO_SHORT");
				expect(err.message).toContain("Cannot decode empty input");
			}
		}
	});
});
