import { describe, expect, it } from "@effect/vitest";
import * as S from "effect/Schema";
import { concat } from "./concat.js";
import { equals } from "./equals.js";
import * as Bytes from "./index.js";
import { size } from "./size.js";
import { toString } from "./toString.js";

describe("Bytes.Hex", () => {
	describe("decode", () => {
		it("parses valid hex string", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(4);
			expect(bytes[0]).toBe(0xde);
			expect(bytes[1]).toBe(0xad);
			expect(bytes[2]).toBe(0xbe);
			expect(bytes[3]).toBe(0xef);
		});

		it("parses empty hex string", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0x");
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(0);
		});

		it("parses lowercase hex", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xabcdef");
			expect(bytes.length).toBe(3);
		});

		it("parses uppercase hex", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xABCDEF");
			expect(bytes.length).toBe(3);
		});

		it("parses mixed case hex", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xAbCdEf");
			expect(bytes.length).toBe(3);
		});

		it("parses large hex string", () => {
			const largeHex = `0x${"ab".repeat(1000)}`;
			const bytes = S.decodeSync(Bytes.Hex)(largeHex);
			expect(bytes.length).toBe(1000);
			expect(bytes[0]).toBe(0xab);
			expect(bytes[999]).toBe(0xab);
		});

		it("fails on missing 0x prefix", () => {
			expect(() => S.decodeSync(Bytes.Hex)("deadbeef")).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() => S.decodeSync(Bytes.Hex)("0xghijkl")).toThrow();
		});

		it("fails on odd-length hex", () => {
			expect(() => S.decodeSync(Bytes.Hex)("0xabc")).toThrow();
		});

		it("fails on non-string input", () => {
			expect(() => S.decodeSync(Bytes.Hex)(123 as unknown as string)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xDEADBEEF");
			const hex = S.encodeSync(Bytes.Hex)(bytes);
			expect(hex).toBe("0xdeadbeef");
		});

		it("encodes empty bytes", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0x");
			const hex = S.encodeSync(Bytes.Hex)(bytes);
			expect(hex).toBe("0x");
		});

		it("encodes large bytes", () => {
			const bytes = new Uint8Array(1000).fill(0xab);
			const hex = S.encodeSync(Bytes.Hex)(bytes);
			expect(hex).toBe(`0x${"ab".repeat(1000)}`);
		});
	});

	describe("round-trip", () => {
		it("decode(encode(bytes)) === bytes", () => {
			const original = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			const encoded = S.encodeSync(Bytes.Hex)(original);
			const decoded = S.decodeSync(Bytes.Hex)(encoded);
			expect(equals(original, decoded)).toBe(true);
		});

		it("round-trips empty bytes", () => {
			const original = S.decodeSync(Bytes.Hex)("0x");
			const encoded = S.encodeSync(Bytes.Hex)(original);
			const decoded = S.decodeSync(Bytes.Hex)(encoded);
			expect(equals(original, decoded)).toBe(true);
		});
	});
});

describe("pure functions", () => {
	describe("isBytes", () => {
		it("returns true for Uint8Array", () => {
			const bytes = new Uint8Array([1, 2, 3]);
			expect(Bytes.isBytes(bytes)).toBe(true);
		});

		it("returns true for decoded bytes", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			expect(Bytes.isBytes(bytes)).toBe(true);
		});

		it("returns false for string", () => {
			expect(Bytes.isBytes("0xdeadbeef")).toBe(false);
		});

		it("returns false for number", () => {
			expect(Bytes.isBytes(123)).toBe(false);
		});

		it("returns false for null", () => {
			expect(Bytes.isBytes(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(Bytes.isBytes(undefined)).toBe(false);
		});

		it("returns false for array", () => {
			expect(Bytes.isBytes([1, 2, 3])).toBe(false);
		});

		it("returns false for object", () => {
			expect(Bytes.isBytes({ length: 3 })).toBe(false);
		});
	});

	describe("equals", () => {
		it("returns true for equal bytes", () => {
			const a = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			const b = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			expect(equals(a, b)).toBe(true);
		});

		it("returns false for different bytes", () => {
			const a = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			const b = S.decodeSync(Bytes.Hex)("0xcafebabe");
			expect(equals(a, b)).toBe(false);
		});

		it("returns false for different lengths", () => {
			const a = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			const b = S.decodeSync(Bytes.Hex)("0xdead");
			expect(equals(a, b)).toBe(false);
		});

		it("returns true for empty bytes", () => {
			const a = S.decodeSync(Bytes.Hex)("0x");
			const b = S.decodeSync(Bytes.Hex)("0x");
			expect(equals(a, b)).toBe(true);
		});
	});

	describe("concat", () => {
		it("concatenates two byte arrays", () => {
			const a = S.decodeSync(Bytes.Hex)("0xdead");
			const b = S.decodeSync(Bytes.Hex)("0xbeef");
			const result = concat(a, b);
			expect(S.encodeSync(Bytes.Hex)(result)).toBe("0xdeadbeef");
		});

		it("concatenates multiple byte arrays", () => {
			const a = S.decodeSync(Bytes.Hex)("0xaa");
			const b = S.decodeSync(Bytes.Hex)("0xbb");
			const c = S.decodeSync(Bytes.Hex)("0xcc");
			const result = concat(a, b, c);
			expect(S.encodeSync(Bytes.Hex)(result)).toBe("0xaabbcc");
		});

		it("handles empty bytes", () => {
			const a = S.decodeSync(Bytes.Hex)("0x");
			const b = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			const result = concat(a, b);
			expect(S.encodeSync(Bytes.Hex)(result)).toBe("0xdeadbeef");
		});

		it("handles all empty bytes", () => {
			const a = S.decodeSync(Bytes.Hex)("0x");
			const b = S.decodeSync(Bytes.Hex)("0x");
			const result = concat(a, b);
			expect(S.encodeSync(Bytes.Hex)(result)).toBe("0x");
		});

		it("handles single input", () => {
			const a = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			const result = concat(a);
			expect(S.encodeSync(Bytes.Hex)(result)).toBe("0xdeadbeef");
		});

		it("handles no input", () => {
			const result = concat();
			expect(S.encodeSync(Bytes.Hex)(result)).toBe("0x");
		});
	});

	describe("size", () => {
		it("returns correct size", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0xdeadbeef");
			expect(size(bytes)).toBe(4);
		});

		it("returns 0 for empty bytes", () => {
			const bytes = S.decodeSync(Bytes.Hex)("0x");
			expect(size(bytes)).toBe(0);
		});

		it("returns correct size for large bytes", () => {
			const bytes = new Uint8Array(1000);
			expect(size(bytes)).toBe(1000);
		});
	});

	describe("toString", () => {
		it("converts bytes to UTF-8 string", () => {
			const bytes = new Uint8Array([104, 101, 108, 108, 111]);
			expect(toString(bytes)).toBe("hello");
		});

		it("handles empty bytes", () => {
			const bytes = new Uint8Array([]);
			expect(toString(bytes)).toBe("");
		});

		it("handles unicode", () => {
			const encoder = new TextEncoder();
			const bytes = encoder.encode("こんにちは");
			expect(toString(bytes)).toBe("こんにちは");
		});
	});

	describe("random", () => {
		it("generates bytes of specified size", () => {
			const bytes = Bytes.random(32);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(32);
		});

		it("generates empty bytes", () => {
			const bytes = Bytes.random(0);
			expect(bytes.length).toBe(0);
		});

		it("generates large bytes", () => {
			const bytes = Bytes.random(10000);
			expect(bytes.length).toBe(10000);
		});

		it("generates different bytes each time", () => {
			const a = Bytes.random(32);
			const b = Bytes.random(32);
			expect(equals(a, b)).toBe(false);
		});
	});
});

describe("error cases", () => {
	describe("Hex schema errors", () => {
		it("fails on null input", () => {
			expect(() =>
				S.decodeSync(Bytes.Hex)(null as unknown as string),
			).toThrow();
		});

		it("fails on undefined input", () => {
			expect(() =>
				S.decodeSync(Bytes.Hex)(undefined as unknown as string),
			).toThrow();
		});

		it("fails on object input", () => {
			expect(() => S.decodeSync(Bytes.Hex)({} as unknown as string)).toThrow();
		});

		it("fails on array input", () => {
			expect(() => S.decodeSync(Bytes.Hex)([] as unknown as string)).toThrow();
		});

		it("fails on boolean input", () => {
			expect(() =>
				S.decodeSync(Bytes.Hex)(true as unknown as string),
			).toThrow();
		});

		it("fails on invalid hex chars", () => {
			expect(() => S.decodeSync(Bytes.Hex)("0xZZZZ")).toThrow();
		});

		it("fails on just prefix with invalid char", () => {
			expect(() => S.decodeSync(Bytes.Hex)("0xZ")).toThrow();
		});
	});
});

describe("edge cases", () => {
	it("handles single byte 0x00", () => {
		const bytes = S.decodeSync(Bytes.Hex)("0x00");
		expect(bytes.length).toBe(1);
		expect(bytes[0]).toBe(0);
	});

	it("handles single byte 0xff", () => {
		const bytes = S.decodeSync(Bytes.Hex)("0xff");
		expect(bytes.length).toBe(1);
		expect(bytes[0]).toBe(255);
	});

	it("concat preserves byte values", () => {
		const a = new Uint8Array([0, 0, 0]);
		const b = new Uint8Array([255, 255, 255]);
		const result = concat(a, b);
		expect(result[0]).toBe(0);
		expect(result[3]).toBe(255);
	});

	it("equals returns false for one empty one non-empty", () => {
		const empty = S.decodeSync(Bytes.Hex)("0x");
		const nonEmpty = S.decodeSync(Bytes.Hex)("0xab");
		expect(equals(empty, nonEmpty)).toBe(false);
	});

	it("size for single byte", () => {
		const bytes = S.decodeSync(Bytes.Hex)("0xab");
		expect(size(bytes)).toBe(1);
	});

	it("toString handles null bytes", () => {
		const bytes = new Uint8Array([0, 0, 0]);
		const str = toString(bytes);
		expect(str.length).toBe(3);
	});

	it("random with size 1", () => {
		const bytes = Bytes.random(1);
		expect(bytes.length).toBe(1);
	});

	it("isBytes returns false for ArrayBuffer", () => {
		const buf = new ArrayBuffer(10);
		expect(Bytes.isBytes(buf)).toBe(false);
	});

	it("isBytes returns true for empty Uint8Array", () => {
		expect(Bytes.isBytes(new Uint8Array(0))).toBe(true);
	});
});

describe("API consistency - infallible ops return directly", () => {
	it("equals returns boolean directly, not Effect", () => {
		const a = S.decodeSync(Bytes.Hex)("0xdeadbeef");
		const b = S.decodeSync(Bytes.Hex)("0xdeadbeef");
		const result = equals(a, b);
		expect(typeof result).toBe("boolean");
		expect(result).toBe(true);
	});

	it("concat returns BytesType directly, not Effect", () => {
		const a = S.decodeSync(Bytes.Hex)("0xdead");
		const b = S.decodeSync(Bytes.Hex)("0xbeef");
		const result = concat(a, b);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	it("size returns number directly, not Effect", () => {
		const bytes = S.decodeSync(Bytes.Hex)("0xdeadbeef");
		const result = size(bytes);
		expect(typeof result).toBe("number");
		expect(result).toBe(4);
	});

	it("isBytes returns boolean directly, not Effect", () => {
		const result = Bytes.isBytes(new Uint8Array([1, 2, 3]));
		expect(typeof result).toBe("boolean");
		expect(result).toBe(true);
	});

	it("random returns BytesType directly, not Effect", () => {
		const result = Bytes.random(16);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(16);
	});

	it("toString returns string directly, not Effect", () => {
		const bytes = new Uint8Array([104, 101, 108, 108, 111]);
		const result = toString(bytes);
		expect(typeof result).toBe("string");
		expect(result).toBe("hello");
	});
});
