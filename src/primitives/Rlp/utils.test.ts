import { describe, expect, it } from "vitest";
import * as Rlp from "../index.js";

describe("RLP Utility Functions", () => {
	describe("encodeArray", () => {
		it("encodes array of values", () => {
			const items = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
			const encoded = Rlp.encodeArray(items);
			expect(encoded).toBeInstanceOf(Uint8Array);
			const decoded = Rlp.decodeArray(encoded);
			expect(decoded).toEqual(items);
		});

		it("encodes empty array", () => {
			const encoded = Rlp.encodeArray([]);
			expect(encoded).toEqual(new Uint8Array([0xc0]));
		});
	});

	describe("encodeObject", () => {
		it("encodes object as key-value pairs", () => {
			const obj = {
				name: new Uint8Array([65, 66, 67]),
				age: new Uint8Array([25]),
			};
			const encoded = Rlp.encodeObject(obj);
			expect(encoded).toBeInstanceOf(Uint8Array);
		});
	});

	describe("encodeVariadic", () => {
		it("encodes variadic arguments", () => {
			const encoded = Rlp.encodeVariadic(
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
				new Uint8Array([5, 6]),
			);
			expect(encoded).toBeInstanceOf(Uint8Array);
			const decoded = Rlp.decodeArray(encoded);
			expect(decoded).toEqual([
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
				new Uint8Array([5, 6]),
			]);
		});
	});

	describe("decodeArray", () => {
		it("decodes to array", () => {
			const items = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
			const encoded = Rlp.encodeArray(items);
			const decoded = Rlp.decodeArray(encoded);
			expect(decoded).toEqual(items);
		});

		it("decodes empty list", () => {
			const encoded = new Uint8Array([0xc0]);
			const decoded = Rlp.decodeArray(encoded);
			expect(decoded).toEqual([]);
		});
	});

	describe("decodeObject", () => {
		it("decodes to object with known keys", () => {
			const obj = {
				name: new Uint8Array([65, 66]),
				age: new Uint8Array([25]),
			};
			const encoded = Rlp.encodeObject(obj);
			const decoded = Rlp.decodeObject(encoded, ["name", "age"]);
			expect(decoded.name).toEqual(new Uint8Array([65, 66]));
			expect(decoded.age).toEqual(new Uint8Array([25]));
		});
	});

	describe("validate", () => {
		it("returns true for valid RLP", () => {
			const valid = new Uint8Array([0x83, 1, 2, 3]);
			expect(Rlp.validate(valid)).toBe(true);
		});

		it("returns false for invalid RLP", () => {
			const invalid = new Uint8Array([0x83, 1]); // incomplete
			expect(Rlp.validate(invalid)).toBe(false);
		});

		it("returns true for single byte", () => {
			const valid = new Uint8Array([0x01]);
			expect(Rlp.validate(valid)).toBe(true);
		});

		it("returns true for empty list", () => {
			const valid = new Uint8Array([0xc0]);
			expect(Rlp.validate(valid)).toBe(true);
		});
	});

	describe("getLength", () => {
		it("gets length of single byte", () => {
			const data = new Uint8Array([0x01]);
			expect(Rlp.getLength(data)).toBe(1);
		});

		it("gets length of short string", () => {
			const data = new Uint8Array([0x83, 1, 2, 3]);
			expect(Rlp.getLength(data)).toBe(4);
		});

		it("gets length of short list", () => {
			const data = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
			expect(Rlp.getLength(data)).toBe(4);
		});

		it("gets length of empty string", () => {
			const data = new Uint8Array([0x80]);
			expect(Rlp.getLength(data)).toBe(1);
		});

		it("gets length of empty list", () => {
			const data = new Uint8Array([0xc0]);
			expect(Rlp.getLength(data)).toBe(1);
		});

		it("throws on empty data", () => {
			expect(() => Rlp.getLength(new Uint8Array([]))).toThrow();
		});
	});

	describe("isList", () => {
		it("returns true for list", () => {
			const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
			expect(Rlp.isList(list)).toBe(true);
		});

		it("returns false for string", () => {
			const str = new Uint8Array([0x83, 0x01, 0x02, 0x03]);
			expect(Rlp.isList(str)).toBe(false);
		});

		it("returns false for single byte", () => {
			const byte = new Uint8Array([0x01]);
			expect(Rlp.isList(byte)).toBe(false);
		});

		it("returns true for empty list", () => {
			const empty = new Uint8Array([0xc0]);
			expect(Rlp.isList(empty)).toBe(true);
		});

		it("throws on empty data", () => {
			expect(() => Rlp.isList(new Uint8Array([]))).toThrow();
		});
	});

	describe("isString", () => {
		it("returns true for string", () => {
			const str = new Uint8Array([0x83, 0x01, 0x02, 0x03]);
			expect(Rlp.isString(str)).toBe(true);
		});

		it("returns false for list", () => {
			const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
			expect(Rlp.isString(list)).toBe(false);
		});

		it("returns true for single byte", () => {
			const byte = new Uint8Array([0x01]);
			expect(Rlp.isString(byte)).toBe(true);
		});

		it("returns true for empty string", () => {
			const empty = new Uint8Array([0x80]);
			expect(Rlp.isString(empty)).toBe(true);
		});

		it("throws on empty data", () => {
			expect(() => Rlp.isString(new Uint8Array([]))).toThrow();
		});
	});

	describe("encodeBatch", () => {
		it("encodes multiple items", () => {
			const items = [
				[new Uint8Array([1, 2]), new Uint8Array([3, 4])],
				[new Uint8Array([5, 6]), new Uint8Array([7, 8])],
			];
			const encoded = Rlp.encodeBatch(items);
			expect(encoded).toHaveLength(2);
			expect(encoded[0]).toBeInstanceOf(Uint8Array);
			expect(encoded[1]).toBeInstanceOf(Uint8Array);
		});

		it("encodes empty batch", () => {
			const encoded = Rlp.encodeBatch([]);
			expect(encoded).toEqual([]);
		});

		it("encodes single item batch", () => {
			const items = [[new Uint8Array([1, 2, 3])]];
			const encoded = Rlp.encodeBatch(items);
			expect(encoded).toHaveLength(1);
		});
	});

	describe("decodeBatch", () => {
		it("decodes multiple items", () => {
			const items = [[new Uint8Array([1, 2])], [new Uint8Array([3, 4])]];
			const encoded = Rlp.encodeBatch(items);
			const decoded = Rlp.decodeBatch(encoded);
			expect(decoded).toEqual(items);
		});

		it("decodes empty batch", () => {
			const decoded = Rlp.decodeBatch([]);
			expect(decoded).toEqual([]);
		});
	});

	describe("integration", () => {
		it("round-trips complex nested structures", () => {
			const data = [
				new Uint8Array([1, 2, 3]),
				[new Uint8Array([4, 5]), new Uint8Array([6, 7])],
				new Uint8Array([8, 9]),
			];
			const encoded = Rlp.encodeArray(data);
			const decoded = Rlp.decodeArray(encoded);
			expect(decoded).toEqual(data);
		});

		it("validates and gets length consistently", () => {
			const data = new Uint8Array([0xc5, 0x01, 0x02, 0x03, 0x04, 0x05]);
			expect(Rlp.validate(data)).toBe(true);
			expect(Rlp.getLength(data)).toBe(6);
			expect(Rlp.isList(data)).toBe(true);
			expect(Rlp.isString(data)).toBe(false);
		});
	});
});
