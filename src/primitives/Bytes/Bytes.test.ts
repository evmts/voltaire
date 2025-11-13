import { describe, expect, it } from "vitest";
import * as Bytes from "./BrandedBytes/index.js";
import * as Bytes1 from "./Bytes1/index.js";
import * as Bytes2 from "./Bytes2/index.js";
import * as Bytes3 from "./Bytes3/index.js";
import * as Bytes4 from "./Bytes4/index.js";
import * as Bytes5 from "./Bytes5/index.js";
import * as Bytes6 from "./Bytes6/index.js";
import * as Bytes7 from "./Bytes7/index.js";
import * as Bytes8 from "./Bytes8/index.js";

describe("BrandedBytes", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const input = new Uint8Array([0x01, 0x02, 0x03]);
			const result = Bytes.from(input);
			expect(result).toEqual(input);
		});

		it("should create from hex string", () => {
			const result = Bytes.from("0x010203");
			expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
		});

		it("should create from UTF-8 string", () => {
			const result = Bytes.from("hello");
			expect(result).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]));
		});

		it("should throw on unsupported type", () => {
			expect(() => Bytes.from(123 as any)).toThrow(
				"Unsupported bytes value type",
			);
		});
	});

	describe("fromHex", () => {
		it("should create from hex string", () => {
			const result = Bytes.fromHex("0x1234");
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});

		it("should handle empty hex", () => {
			const result = Bytes.fromHex("0x");
			expect(result).toEqual(new Uint8Array([]));
		});

		it("should throw on missing 0x prefix", () => {
			expect(() => Bytes.fromHex("1234")).toThrow("must start with 0x");
		});

		it("should throw on odd length", () => {
			expect(() => Bytes.fromHex("0x123")).toThrow("must have even length");
		});

		it("should throw on invalid hex", () => {
			expect(() => Bytes.fromHex("0xGG")).toThrow("Invalid hex character");
		});
	});

	describe("fromString", () => {
		it("should create from UTF-8 string", () => {
			const result = Bytes.fromString("hello");
			expect(result).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]));
		});

		it("should handle empty string", () => {
			const result = Bytes.fromString("");
			expect(result).toEqual(new Uint8Array([]));
		});

		it("should handle unicode", () => {
			const result = Bytes.fromString("😀");
			expect(result.length).toBeGreaterThan(1);
		});
	});

	describe("toHex", () => {
		it("should convert to hex string", () => {
			const bytes = new Uint8Array([0x12, 0x34]) as Bytes.BrandedBytes;
			const result = Bytes.toHex(bytes);
			expect(result).toBe("0x1234");
		});

		it("should pad single digit bytes", () => {
			const bytes = new Uint8Array([0x01, 0x0a]) as Bytes.BrandedBytes;
			const result = Bytes.toHex(bytes);
			expect(result).toBe("0x010a");
		});

		it("should handle empty bytes", () => {
			const bytes = new Uint8Array([]) as Bytes.BrandedBytes;
			const result = Bytes.toHex(bytes);
			expect(result).toBe("0x");
		});
	});

	describe("toString", () => {
		it("should convert to UTF-8 string", () => {
			const bytes = new Uint8Array([
				0x68, 0x65, 0x6c, 0x6c, 0x6f,
			]) as Bytes.BrandedBytes;
			const result = Bytes.toString(bytes);
			expect(result).toBe("hello");
		});

		it("should handle empty bytes", () => {
			const bytes = new Uint8Array([]) as Bytes.BrandedBytes;
			const result = Bytes.toString(bytes);
			expect(result).toBe("");
		});
	});

	describe("concat", () => {
		it("should concatenate multiple bytes", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x03, 0x04]) as Bytes.BrandedBytes;
			const c = new Uint8Array([0x05]) as Bytes.BrandedBytes;
			const result = Bytes.concat(a, b, c);
			expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
		});

		it("should handle empty arrays", () => {
			const a = new Uint8Array([0x01]) as Bytes.BrandedBytes;
			const b = new Uint8Array([]) as Bytes.BrandedBytes;
			const result = Bytes.concat(a, b);
			expect(result).toEqual(new Uint8Array([0x01]));
		});

		it("should work with single array", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const result = Bytes.concat(a);
			expect(result).toEqual(new Uint8Array([0x01, 0x02]));
		});
	});

	describe("slice", () => {
		it("should slice bytes", () => {
			const bytes = new Uint8Array([
				0x01, 0x02, 0x03, 0x04,
			]) as Bytes.BrandedBytes;
			const result = Bytes.slice(bytes, 1, 3);
			expect(result).toEqual(new Uint8Array([0x02, 0x03]));
		});

		it("should slice to end", () => {
			const bytes = new Uint8Array([0x01, 0x02, 0x03]) as Bytes.BrandedBytes;
			const result = Bytes.slice(bytes, 1);
			expect(result).toEqual(new Uint8Array([0x02, 0x03]));
		});

		it("should handle empty slice", () => {
			const bytes = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const result = Bytes.slice(bytes, 1, 1);
			expect(result).toEqual(new Uint8Array([]));
		});
	});

	describe("equals", () => {
		it("should return true for equal bytes", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			expect(Bytes.equals(a, b)).toBe(true);
		});

		it("should return false for different bytes", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01, 0x03]) as Bytes.BrandedBytes;
			expect(Bytes.equals(a, b)).toBe(false);
		});

		it("should return false for different lengths", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01]) as Bytes.BrandedBytes;
			expect(Bytes.equals(a, b)).toBe(false);
		});

		it("should return true for empty bytes", () => {
			const a = new Uint8Array([]) as Bytes.BrandedBytes;
			const b = new Uint8Array([]) as Bytes.BrandedBytes;
			expect(Bytes.equals(a, b)).toBe(true);
		});
	});

	describe("compare", () => {
		it("should return 0 for equal bytes", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			expect(Bytes.compare(a, b)).toBe(0);
		});

		it("should return -1 when first is less", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01, 0x03]) as Bytes.BrandedBytes;
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should return 1 when first is greater", () => {
			const a = new Uint8Array([0x01, 0x03]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			expect(Bytes.compare(a, b)).toBe(1);
		});

		it("should return -1 when first is shorter", () => {
			const a = new Uint8Array([0x01]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should return 1 when first is longer", () => {
			const a = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const b = new Uint8Array([0x01]) as Bytes.BrandedBytes;
			expect(Bytes.compare(a, b)).toBe(1);
		});
	});

	describe("size", () => {
		it("should return byte length", () => {
			const bytes = new Uint8Array([0x01, 0x02, 0x03]) as Bytes.BrandedBytes;
			expect(Bytes.size(bytes)).toBe(3);
		});

		it("should return 0 for empty", () => {
			const bytes = new Uint8Array([]) as Bytes.BrandedBytes;
			expect(Bytes.size(bytes)).toBe(0);
		});
	});

	describe("clone", () => {
		it("should create independent copy", () => {
			const original = new Uint8Array([0x01, 0x02]) as Bytes.BrandedBytes;
			const copy = Bytes.clone(original);
			expect(copy).toEqual(original);
			expect(copy).not.toBe(original);
			copy[0] = 0xff;
			expect(original[0]).toBe(0x01);
		});
	});

	describe("isEmpty", () => {
		it("should return true for empty bytes", () => {
			const bytes = new Uint8Array([]) as Bytes.BrandedBytes;
			expect(Bytes.isEmpty(bytes)).toBe(true);
		});

		it("should return false for non-empty bytes", () => {
			const bytes = new Uint8Array([0x01]) as Bytes.BrandedBytes;
			expect(Bytes.isEmpty(bytes)).toBe(false);
		});
	});

	describe("zero", () => {
		it("should create zero bytes", () => {
			const result = Bytes.zero(4);
			expect(result).toEqual(new Uint8Array([0, 0, 0, 0]));
		});

		it("should create empty bytes with size 0", () => {
			const result = Bytes.zero(0);
			expect(result).toEqual(new Uint8Array([]));
		});
	});
});

describe("Bytes1", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes1.from(new Uint8Array([0x12]));
			expect(result).toEqual(new Uint8Array([0x12]));
		});

		it("should create from hex string", () => {
			const result = Bytes1.from("0x12");
			expect(result).toEqual(new Uint8Array([0x12]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes1.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 1 byte",
			);
		});

		it("should throw on empty", () => {
			expect(() => Bytes1.from(new Uint8Array([]))).toThrow("exactly 1 byte");
		});
	});

	describe("fromHex", () => {
		it("should create from hex", () => {
			const result = Bytes1.fromHex("0x12");
			expect(result).toEqual(new Uint8Array([0x12]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes1.fromHex("0x1234")).toThrow("exactly 1 byte");
		});
	});

	describe("fromNumber", () => {
		it("should create from number", () => {
			const result = Bytes1.fromNumber(42);
			expect(result).toEqual(new Uint8Array([42]));
		});

		it("should handle 0", () => {
			const result = Bytes1.fromNumber(0);
			expect(result).toEqual(new Uint8Array([0]));
		});

		it("should handle 255", () => {
			const result = Bytes1.fromNumber(255);
			expect(result).toEqual(new Uint8Array([255]));
		});

		it("should throw on negative", () => {
			expect(() => Bytes1.fromNumber(-1)).toThrow("0-255");
		});

		it("should throw on > 255", () => {
			expect(() => Bytes1.fromNumber(256)).toThrow("0-255");
		});
	});

	describe("toNumber", () => {
		it("should convert to number", () => {
			const bytes = new Uint8Array([42]) as Bytes1.BrandedBytes1;
			expect(Bytes1.toNumber(bytes)).toBe(42);
		});

		it("should handle 0", () => {
			const bytes = new Uint8Array([0]) as Bytes1.BrandedBytes1;
			expect(Bytes1.toNumber(bytes)).toBe(0);
		});

		it("should handle 255", () => {
			const bytes = new Uint8Array([255]) as Bytes1.BrandedBytes1;
			expect(Bytes1.toNumber(bytes)).toBe(255);
		});
	});

	describe("toHex", () => {
		it("should convert to hex", () => {
			const bytes = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			expect(Bytes1.toHex(bytes)).toBe("0x12");
		});

		it("should pad single digit", () => {
			const bytes = new Uint8Array([0x01]) as Bytes1.BrandedBytes1;
			expect(Bytes1.toHex(bytes)).toBe("0x01");
		});
	});

	describe("equals", () => {
		it("should return true for equal", () => {
			const a = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			const b = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			expect(Bytes1.equals(a, b)).toBe(true);
		});

		it("should return false for different", () => {
			const a = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			const b = new Uint8Array([0x34]) as Bytes1.BrandedBytes1;
			expect(Bytes1.equals(a, b)).toBe(false);
		});
	});

	describe("compare", () => {
		it("should return 0 for equal", () => {
			const a = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			const b = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			expect(Bytes1.compare(a, b)).toBe(0);
		});

		it("should return -1 when first is less", () => {
			const a = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			const b = new Uint8Array([0x34]) as Bytes1.BrandedBytes1;
			expect(Bytes1.compare(a, b)).toBe(-1);
		});

		it("should return 1 when first is greater", () => {
			const a = new Uint8Array([0x34]) as Bytes1.BrandedBytes1;
			const b = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			expect(Bytes1.compare(a, b)).toBe(1);
		});
	});

	describe("size", () => {
		it("should always return 1", () => {
			const bytes = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			expect(Bytes1.size(bytes)).toBe(1);
		});
	});

	describe("clone", () => {
		it("should create independent copy", () => {
			const original = new Uint8Array([0x12]) as Bytes1.BrandedBytes1;
			const copy = Bytes1.clone(original);
			expect(copy).toEqual(original);
			expect(copy).not.toBe(original);
		});
	});
});

describe("Bytes4", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes4.from(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
			expect(result).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
		});

		it("should create from hex string", () => {
			const result = Bytes4.from("0x12345678");
			expect(result).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes4.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 4 bytes",
			);
		});
	});

	describe("fromHex (function selectors)", () => {
		it("should create from function selector", () => {
			const result = Bytes4.fromHex("0xa9059cbb"); // transfer(address,uint256)
			expect(result).toEqual(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes4.fromHex("0x1234")).toThrow("exactly 4 bytes");
		});
	});

	describe("toHex", () => {
		it("should convert to hex", () => {
			const bytes = new Uint8Array([
				0xa9, 0x05, 0x9c, 0xbb,
			]) as Bytes4.BrandedBytes4;
			expect(Bytes4.toHex(bytes)).toBe("0xa9059cbb");
		});
	});

	describe("equals", () => {
		it("should return true for equal", () => {
			const a = new Uint8Array([
				0x12, 0x34, 0x56, 0x78,
			]) as Bytes4.BrandedBytes4;
			const b = new Uint8Array([
				0x12, 0x34, 0x56, 0x78,
			]) as Bytes4.BrandedBytes4;
			expect(Bytes4.equals(a, b)).toBe(true);
		});

		it("should return false for different", () => {
			const a = new Uint8Array([
				0x12, 0x34, 0x56, 0x78,
			]) as Bytes4.BrandedBytes4;
			const b = new Uint8Array([
				0x12, 0x34, 0x56, 0x79,
			]) as Bytes4.BrandedBytes4;
			expect(Bytes4.equals(a, b)).toBe(false);
		});
	});

	describe("size", () => {
		it("should always return 4", () => {
			const bytes = new Uint8Array([
				0x12, 0x34, 0x56, 0x78,
			]) as Bytes4.BrandedBytes4;
			expect(Bytes4.size(bytes)).toBe(4);
		});
	});
});

describe("Bytes2", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes2.from(new Uint8Array([0x12, 0x34]));
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes2.from(new Uint8Array([0x12]))).toThrow(
				"exactly 2 bytes",
			);
		});
	});
});

describe("Bytes3", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes3.from(new Uint8Array([0x12, 0x34, 0x56]));
			expect(result).toEqual(new Uint8Array([0x12, 0x34, 0x56]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes3.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 3 bytes",
			);
		});
	});
});

describe("Bytes5", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes5.from(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]),
			);
			expect(result).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]));
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes5.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 5 bytes",
			);
		});
	});
});

describe("Bytes6", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes6.from(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]),
			);
			expect(result).toEqual(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]),
			);
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes6.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 6 bytes",
			);
		});
	});
});

describe("Bytes7", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes7.from(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde]),
			);
			expect(result).toEqual(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde]),
			);
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes7.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 7 bytes",
			);
		});
	});
});

describe("Bytes8", () => {
	describe("from", () => {
		it("should create from Uint8Array", () => {
			const result = Bytes8.from(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
			);
			expect(result).toEqual(
				new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
			);
		});

		it("should throw on wrong size", () => {
			expect(() => Bytes8.from(new Uint8Array([0x12, 0x34]))).toThrow(
				"exactly 8 bytes",
			);
		});
	});

	describe("toHex", () => {
		it("should convert to hex", () => {
			const bytes = new Uint8Array([
				0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
			]) as Bytes8.BrandedBytes8;
			expect(Bytes8.toHex(bytes)).toBe("0x123456789abcdef0");
		});
	});

	describe("size", () => {
		it("should always return 8", () => {
			const bytes = new Uint8Array([
				0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
			]) as Bytes8.BrandedBytes8;
			expect(Bytes8.size(bytes)).toBe(8);
		});
	});
});

describe("Bytes conversions", () => {
	it("should convert between fixed and generic", () => {
		const fixed = Bytes4.from("0x12345678");
		const generic = Bytes4.toBytes(fixed);
		expect(generic).toEqual(fixed);
	});

	it("should roundtrip through hex", () => {
		const original = Bytes4.from("0xa9059cbb");
		const hex = Bytes4.toHex(original);
		const result = Bytes4.fromHex(hex);
		expect(result).toEqual(original);
	});

	it("should concat fixed sizes into generic", () => {
		const a = Bytes2.from("0x1234");
		const b = Bytes2.from("0x5678");
		const result = Bytes.concat(Bytes2.toBytes(a), Bytes2.toBytes(b));
		expect(result).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
	});
});

describe("Edge cases", () => {
	it("should handle all zeros", () => {
		const bytes = Bytes4.from(new Uint8Array([0, 0, 0, 0]));
		expect(Bytes4.toHex(bytes)).toBe("0x00000000");
	});

	it("should handle all ones", () => {
		const bytes = Bytes4.from(new Uint8Array([255, 255, 255, 255]));
		expect(Bytes4.toHex(bytes)).toBe("0xffffffff");
	});

	it("should handle mixed case hex", () => {
		const result = Bytes4.from("0xAbCdEf12");
		expect(result).toEqual(new Uint8Array([0xab, 0xcd, 0xef, 0x12]));
	});
});
