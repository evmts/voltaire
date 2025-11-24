/**
 * Comprehensive tests for JSON conversion (toJSON/fromJSON)
 */

import { describe, expect, it } from "vitest";
import { RlpDecodingError } from "./RlpError.js";
import type { BrandedRlp } from "./RlpType.js";
import { fromJSON } from "./fromJSON.js";
import { toJSON } from "./toJSON.js";

describe("Rlp.toJSON", () => {
	it("converts bytes Data to JSON", () => {
		const data: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "bytes",
			value: [1, 2, 3],
		});
	});

	it("converts empty bytes Data to JSON", () => {
		const data: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([]),
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "bytes",
			value: [],
		});
	});

	it("converts empty list Data to JSON", () => {
		const data: BrandedRlp = {
			type: "list",
			value: [],
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "list",
			value: [],
		});
	});

	it("converts list Data with single item to JSON", () => {
		const data: BrandedRlp = {
			type: "list",
			value: [{ type: "bytes", value: new Uint8Array([1]) }],
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "list",
			value: [{ type: "bytes", value: [1] }],
		});
	});

	it("converts list Data with multiple items to JSON", () => {
		const data: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1, 2]) },
				{ type: "bytes", value: new Uint8Array([3, 4]) },
			],
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: [1, 2] },
				{ type: "bytes", value: [3, 4] },
			],
		});
	});

	it("converts nested list Data to JSON", () => {
		const data: BrandedRlp = {
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
		const json = toJSON(data);
		expect(json).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: [1] },
				{
					type: "list",
					value: [
						{ type: "bytes", value: [2] },
						{ type: "bytes", value: [3] },
					],
				},
			],
		});
	});

	it("converts deeply nested structure to JSON", () => {
		const data: BrandedRlp = {
			type: "list",
			value: [
				{
					type: "list",
					value: [
						{
							type: "list",
							value: [{ type: "bytes", value: new Uint8Array([1]) }],
						},
					],
				},
			],
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "list",
			value: [
				{
					type: "list",
					value: [
						{
							type: "list",
							value: [{ type: "bytes", value: [1] }],
						},
					],
				},
			],
		});
	});

	it("preserves large byte values", () => {
		const data: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([0, 127, 128, 255]),
		};
		const json = toJSON(data);
		expect(json).toEqual({
			type: "bytes",
			value: [0, 127, 128, 255],
		});
	});
});

describe("Rlp.fromJSON", () => {
	it("converts JSON bytes to Data", () => {
		const json = {
			type: "bytes",
			value: [1, 2, 3],
		};
		const data = fromJSON(json);
		expect(data).toEqual({
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		});
	});

	it("converts JSON empty bytes to Data", () => {
		const json = {
			type: "bytes",
			value: [],
		};
		const data = fromJSON(json);
		expect(data).toEqual({
			type: "bytes",
			value: new Uint8Array([]),
		});
	});

	it("converts JSON empty list to Data", () => {
		const json = {
			type: "list",
			value: [],
		};
		const data = fromJSON(json);
		expect(data).toEqual({
			type: "list",
			value: [],
		});
	});

	it("converts JSON list to Data", () => {
		const json = {
			type: "list",
			value: [
				{ type: "bytes", value: [1] },
				{ type: "bytes", value: [2] },
			],
		};
		const data = fromJSON(json);
		expect(data).toEqual({
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{ type: "bytes", value: new Uint8Array([2]) },
			],
		});
	});

	it("converts JSON nested list to Data", () => {
		const json = {
			type: "list",
			value: [
				{ type: "bytes", value: [1] },
				{
					type: "list",
					value: [{ type: "bytes", value: [2] }],
				},
			],
		};
		const data = fromJSON(json);
		expect(data.type).toBe("list");
		if (data.type === "list") {
			expect(data.value.length).toBe(2);
			expect(data.value[0]?.type).toBe("bytes");
			expect(data.value[1]?.type).toBe("list");
		}
	});

	it("throws on null input", () => {
		expect(() => fromJSON(null as any)).toThrow(RlpDecodingError);
	});

	it("throws on undefined input", () => {
		expect(() => fromJSON(undefined as any)).toThrow(RlpDecodingError);
	});

	it("throws on string input", () => {
		expect(() => fromJSON("invalid" as any)).toThrow(RlpDecodingError);
	});

	it("throws on number input", () => {
		expect(() => fromJSON(123 as any)).toThrow(RlpDecodingError);
	});

	it("throws on empty object", () => {
		expect(() => fromJSON({} as any)).toThrow(RlpDecodingError);
	});

	it("throws on invalid type", () => {
		const invalid = { type: "invalid", value: [] };
		expect(() => fromJSON(invalid as any)).toThrow(RlpDecodingError);
	});

	it("throws on missing type field", () => {
		const invalid = { value: [1, 2, 3] };
		expect(() => fromJSON(invalid as any)).toThrow(RlpDecodingError);
	});

	it("throws on missing value field", () => {
		const invalid = { type: "bytes" };
		expect(() => fromJSON(invalid as any)).toThrow(RlpDecodingError);
	});

	it("throws on non-array bytes value", () => {
		const invalid = { type: "bytes", value: "not an array" };
		expect(() => fromJSON(invalid as any)).toThrow(RlpDecodingError);
	});

	it("throws on non-array list value", () => {
		const invalid = { type: "list", value: "not an array" };
		expect(() => fromJSON(invalid as any)).toThrow(RlpDecodingError);
	});
});

describe("Rlp.toJSON/fromJSON round-trip", () => {
	it("round-trips simple bytes", () => {
		const original: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([1, 2, 3]),
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips empty bytes", () => {
		const original: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array([]),
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips empty list", () => {
		const original: BrandedRlp = {
			type: "list",
			value: [],
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips simple list", () => {
		const original: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{ type: "bytes", value: new Uint8Array([2]) },
			],
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips nested list", () => {
		const original: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1]) },
				{
					type: "list",
					value: [{ type: "bytes", value: new Uint8Array([2]) }],
				},
			],
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips deeply nested structure", () => {
		const original: BrandedRlp = {
			type: "list",
			value: [
				{
					type: "list",
					value: [
						{
							type: "list",
							value: [{ type: "bytes", value: new Uint8Array([1]) }],
						},
					],
				},
			],
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips large bytes", () => {
		const original: BrandedRlp = {
			type: "bytes",
			value: new Uint8Array(1000).fill(0xff),
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("round-trips complex mixed structure", () => {
		const original: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1, 2, 3]) },
				{
					type: "list",
					value: [
						{ type: "bytes", value: new Uint8Array([4]) },
						{
							type: "list",
							value: [{ type: "bytes", value: new Uint8Array([5, 6]) }],
						},
					],
				},
				{ type: "bytes", value: new Uint8Array([]) },
			],
		};
		const json = toJSON(original);
		const restored = fromJSON(json);
		expect(restored).toEqual(original);
	});

	it("JSON is serializable", () => {
		const original: BrandedRlp = {
			type: "list",
			value: [
				{ type: "bytes", value: new Uint8Array([1, 2, 3]) },
				{
					type: "list",
					value: [{ type: "bytes", value: new Uint8Array([4]) }],
				},
			],
		};
		const json = toJSON(original);
		const jsonString = JSON.stringify(json);
		const parsed = JSON.parse(jsonString);
		const restored = fromJSON(parsed);
		expect(restored).toEqual(original);
	});
});
