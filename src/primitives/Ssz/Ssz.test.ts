import { describe, expect, it } from "vitest";
import * as Ssz from "./index.js";

describe("SSZ Basic Types", () => {
	describe("uint8", () => {
		it("encodes uint8", () => {
			const encoded = Ssz.encodeBasic(42, "uint8");
			expect(encoded).toEqual(new Uint8Array([42]));
		});

		it("decodes uint8", () => {
			const decoded = Ssz.decodeBasic(new Uint8Array([42]), "uint8");
			expect(decoded).toBe(42);
		});

		it("roundtrip uint8", () => {
			const original = 255;
			const encoded = Ssz.encodeBasic(original, "uint8");
			const decoded = Ssz.decodeBasic(encoded, "uint8");
			expect(decoded).toBe(original);
		});
	});

	describe("uint16", () => {
		it("encodes uint16 little-endian", () => {
			const encoded = Ssz.encodeBasic(0x1234, "uint16");
			expect(encoded).toEqual(new Uint8Array([0x34, 0x12]));
		});

		it("decodes uint16", () => {
			const decoded = Ssz.decodeBasic(new Uint8Array([0x34, 0x12]), "uint16");
			expect(decoded).toBe(0x1234);
		});

		it("roundtrip uint16", () => {
			const original = 0xabcd;
			const encoded = Ssz.encodeBasic(original, "uint16");
			const decoded = Ssz.decodeBasic(encoded, "uint16");
			expect(decoded).toBe(original);
		});
	});

	describe("uint32", () => {
		it("encodes uint32 little-endian", () => {
			const encoded = Ssz.encodeBasic(0x12345678, "uint32");
			expect(encoded).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
		});

		it("decodes uint32", () => {
			const decoded = Ssz.decodeBasic(
				new Uint8Array([0x78, 0x56, 0x34, 0x12]),
				"uint32",
			);
			expect(decoded).toBe(0x12345678);
		});

		it("roundtrip uint32", () => {
			const original = 0xdeadbeef;
			const encoded = Ssz.encodeBasic(original, "uint32");
			const decoded = Ssz.decodeBasic(encoded, "uint32");
			expect(decoded).toBe(original);
		});
	});

	describe("uint64", () => {
		it("encodes uint64 little-endian", () => {
			const encoded = Ssz.encodeBasic(0x123456789abcdefn, "uint64");
			expect(encoded[0]).toBe(0xef);
			expect(encoded[1]).toBe(0xcd);
			expect(encoded[7]).toBe(0x01);
		});

		it("decodes uint64", () => {
			const bytes = new Uint8Array(8);
			bytes[0] = 0xef;
			bytes[1] = 0xcd;
			bytes[2] = 0xab;
			bytes[3] = 0x89;
			bytes[4] = 0x67;
			bytes[5] = 0x45;
			bytes[6] = 0x23;
			bytes[7] = 0x01;
			const decoded = Ssz.decodeBasic(bytes, "uint64");
			expect(decoded).toBe(0x123456789abcdefn);
		});

		it("roundtrip uint64", () => {
			const original = 0xfedcba9876543210n;
			const encoded = Ssz.encodeBasic(original, "uint64");
			const decoded = Ssz.decodeBasic(encoded, "uint64");
			expect(decoded).toBe(original);
		});
	});

	describe("uint256", () => {
		it("encodes uint256 little-endian", () => {
			const value = 0x123456n;
			const encoded = Ssz.encodeBasic(value, "uint256");
			expect(encoded.length).toBe(32);
			expect(encoded[0]).toBe(0x56);
			expect(encoded[1]).toBe(0x34);
			expect(encoded[2]).toBe(0x12);
			expect(encoded[3]).toBe(0x00);
		});

		it("decodes uint256", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x56;
			bytes[1] = 0x34;
			bytes[2] = 0x12;
			const decoded = Ssz.decodeBasic(bytes, "uint256");
			expect(decoded).toBe(0x123456n);
		});

		it("roundtrip uint256", () => {
			const original = 0xdeadbeefcafebaben;
			const encoded = Ssz.encodeBasic(original, "uint256");
			const decoded = Ssz.decodeBasic(encoded, "uint256");
			expect(decoded).toBe(original);
		});
	});

	describe("bool", () => {
		it("encodes true", () => {
			const encoded = Ssz.encodeBasic(true, "bool");
			expect(encoded).toEqual(new Uint8Array([1]));
		});

		it("encodes false", () => {
			const encoded = Ssz.encodeBasic(false, "bool");
			expect(encoded).toEqual(new Uint8Array([0]));
		});

		it("decodes true", () => {
			const decoded = Ssz.decodeBasic(new Uint8Array([1]), "bool");
			expect(decoded).toBe(true);
		});

		it("decodes false", () => {
			const decoded = Ssz.decodeBasic(new Uint8Array([0]), "bool");
			expect(decoded).toBe(false);
		});

		it("rejects invalid boolean values > 1", () => {
			expect(() => Ssz.decodeBasic(new Uint8Array([2]), "bool")).toThrow(
				"Invalid boolean value",
			);
			expect(() => Ssz.decodeBasic(new Uint8Array([42]), "bool")).toThrow(
				"Invalid boolean value",
			);
			expect(() => Ssz.decodeBasic(new Uint8Array([255]), "bool")).toThrow(
				"Invalid boolean value",
			);
		});
	});

	describe("errors", () => {
		it("throws on invalid uint16 length", () => {
			expect(() => Ssz.decodeBasic(new Uint8Array([1]), "uint16")).toThrow(
				"Invalid length",
			);
		});

		it("throws on unsupported type", () => {
			expect(() => Ssz.encodeBasic(42, "invalid")).toThrow("Unsupported type");
		});
	});

	describe("range validation", () => {
		// uint8 range: 0-255
		it("throws on uint8 value > 255", () => {
			expect(() => Ssz.encodeBasic(256, "uint8")).toThrow(RangeError);
		});

		it("throws on negative uint8 value", () => {
			expect(() => Ssz.encodeBasic(-1, "uint8")).toThrow(RangeError);
		});

		it("throws on non-integer uint8 value", () => {
			expect(() => Ssz.encodeBasic(1.5, "uint8")).toThrow(RangeError);
		});

		it("accepts max uint8 value (255)", () => {
			expect(Ssz.encodeBasic(255, "uint8")).toEqual(new Uint8Array([255]));
		});

		// uint16 range: 0-65535
		it("throws on uint16 value > 65535", () => {
			expect(() => Ssz.encodeBasic(65536, "uint16")).toThrow(RangeError);
		});

		it("throws on negative uint16 value", () => {
			expect(() => Ssz.encodeBasic(-1, "uint16")).toThrow(RangeError);
		});

		it("throws on non-integer uint16 value", () => {
			expect(() => Ssz.encodeBasic(1.5, "uint16")).toThrow(RangeError);
		});

		it("accepts max uint16 value (65535)", () => {
			const encoded = Ssz.encodeBasic(65535, "uint16");
			expect(encoded).toEqual(new Uint8Array([0xff, 0xff]));
		});

		// uint32 range: 0-4294967295
		it("throws on uint32 value > 4294967295", () => {
			expect(() => Ssz.encodeBasic(4294967296, "uint32")).toThrow(RangeError);
		});

		it("throws on negative uint32 value", () => {
			expect(() => Ssz.encodeBasic(-1, "uint32")).toThrow(RangeError);
		});

		it("throws on non-integer uint32 value", () => {
			expect(() => Ssz.encodeBasic(1.5, "uint32")).toThrow(RangeError);
		});

		it("accepts max uint32 value (4294967295)", () => {
			const encoded = Ssz.encodeBasic(4294967295, "uint32");
			expect(encoded).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
		});
	});
});

describe("SSZ Hash Tree Root", () => {
	it("computes hash tree root for empty data", async () => {
		const root = await Ssz.hashTreeRoot(new Uint8Array(0));
		expect(root).toBeInstanceOf(Uint8Array);
		expect(root.length).toBe(32);
		// Empty should return zero hash
		expect(root).toEqual(new Uint8Array(32));
	});

	it("computes hash tree root for single byte", async () => {
		const root = await Ssz.hashTreeRoot(new Uint8Array([42]));
		expect(root).toBeInstanceOf(Uint8Array);
		expect(root.length).toBe(32);
		// Should not be all zeros
		expect(root.some((b) => b !== 0)).toBe(true);
	});

	it("computes hash tree root for 32 bytes", async () => {
		const data = new Uint8Array(32).fill(0xff);
		const root = await Ssz.hashTreeRoot(data);
		expect(root).toBeInstanceOf(Uint8Array);
		expect(root.length).toBe(32);
	});

	it("computes hash tree root for 64 bytes", async () => {
		const data = new Uint8Array(64);
		for (let i = 0; i < 64; i++) {
			data[i] = i;
		}
		const root = await Ssz.hashTreeRoot(data);
		expect(root).toBeInstanceOf(Uint8Array);
		expect(root.length).toBe(32);
	});

	it("hash tree root is deterministic", async () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const root1 = await Ssz.hashTreeRoot(data);
		const root2 = await Ssz.hashTreeRoot(data);
		expect(root1).toEqual(root2);
	});

	it("different data produces different roots", async () => {
		const root1 = await Ssz.hashTreeRoot(new Uint8Array([1, 2, 3]));
		const root2 = await Ssz.hashTreeRoot(new Uint8Array([4, 5, 6]));
		expect(root1).not.toEqual(root2);
	});
});
