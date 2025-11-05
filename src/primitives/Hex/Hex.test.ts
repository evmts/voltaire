import { describe, expect, it } from "vitest";
import {
	type BrandedHex,
	Hex,
	InvalidHexCharacterError,
	InvalidHexFormatError,
	InvalidHexLengthError,
	OddLengthHexError,
} from "./index.js";

describe("Hex", () => {
	describe("isHex", () => {
		it("validates correct hex strings", () => {
			expect(Hex.isHex("0x0")).toBe(true);
			expect(Hex.isHex("0x00")).toBe(true);
			expect(Hex.isHex("0x1234")).toBe(true);
			expect(Hex.isHex("0xabcdef")).toBe(true);
			expect(Hex.isHex("0xABCDEF")).toBe(true);
			expect(Hex.isHex("0xdeadbeef")).toBe(true);
		});

		it("rejects invalid hex strings", () => {
			expect(Hex.isHex("")).toBe(false);
			expect(Hex.isHex("0x")).toBe(false);
			expect(Hex.isHex("1234")).toBe(false);
			expect(Hex.isHex("0xg")).toBe(false);
			expect(Hex.isHex("0x ")).toBe(false);
			expect(Hex.isHex(" 0x00")).toBe(false);
		});
	});

	describe("validate", () => {
		it("creates validated hex from valid string", () => {
			const hex = Hex.validate("0x1234");
			expect(hex).toBe("0x1234");
		});

		it("throws on invalid hex", () => {
			expect(() => Hex.validate("1234")).toThrow(InvalidHexFormatError);
			expect(() => Hex.validate("0xg")).toThrow(InvalidHexCharacterError);
		});
	});

	describe("fromBytes", () => {
		it("converts empty bytes", () => {
			expect(Hex.fromBytes(new Uint8Array([]))).toBe("0x");
		});

		it("converts single byte", () => {
			expect(Hex.fromBytes(new Uint8Array([0x61]))).toBe("0x61");
		});

		it("converts multiple bytes", () => {
			expect(Hex.fromBytes(new Uint8Array([0x12, 0x34, 0xab, 0xcd]))).toBe(
				"0x1234abcd",
			);
		});

		it("converts text to hex", () => {
			const encoder = new TextEncoder();
			expect(Hex.fromBytes(encoder.encode("Hello World!"))).toBe(
				"0x48656c6c6f20576f726c6421",
			);
		});
	});

	describe("toBytes", () => {
		it("converts empty hex", () => {
			const bytes = Hex.toBytes("0x" as BrandedHex);
			expect(bytes.length).toBe(0);
		});

		it("converts single byte", () => {
			const bytes = Hex.toBytes("0x61" as BrandedHex);
			expect(Array.from(bytes)).toEqual([0x61]);
		});

		it("converts multiple bytes", () => {
			const bytes = Hex.toBytes("0x616263" as BrandedHex);
			expect(Array.from(bytes)).toEqual([0x61, 0x62, 0x63]);
		});

		it("handles mixed case", () => {
			const bytes = Hex.toBytes("0xDeAdBeEf" as BrandedHex);
			expect(Array.from(bytes)).toEqual([0xde, 0xad, 0xbe, 0xef]);
		});

		it("throws on odd length", () => {
			expect(() => Hex.toBytes("0x1" as BrandedHex)).toThrow(OddLengthHexError);
			expect(() => Hex.toBytes("0x123" as BrandedHex)).toThrow(
				OddLengthHexError,
			);
		});

		it("throws on invalid character", () => {
			expect(() => Hex.toBytes("0xdeadbeeg" as BrandedHex)).toThrow(
				InvalidHexCharacterError,
			);
		});
	});

	describe("concat", () => {
		it("concatenates hex strings", () => {
			const hex1 = "0x1234" as BrandedHex;
			const hex2 = "0xabcd" as BrandedHex;
			expect(Hex.concat(hex1, hex2)).toBe("0x1234abcd");
		});

		it("concatenates multiple hex strings", () => {
			const hex1 = "0x12" as BrandedHex;
			const hex2 = "0x34" as BrandedHex;
			const hex3 = "0xab" as BrandedHex;
			expect(Hex.concat(hex1, hex2, hex3)).toBe("0x1234ab");
		});

		it("concatenates empty hex strings", () => {
			const hex1 = "0x" as BrandedHex;
			const hex2 = "0x1234" as BrandedHex;
			expect(Hex.concat(hex1, hex2)).toBe("0x1234");
		});
	});

	describe("slice", () => {
		it("slices hex string", () => {
			const hex = "0x1234abcd" as BrandedHex;
			expect(Hex.slice(hex, 0, 2)).toBe("0x1234");
			expect(Hex.slice(hex, 1, 3)).toBe("0x34ab");
		});

		it("slices from start to end", () => {
			const hex = "0x1234abcd" as BrandedHex;
			expect(Hex.slice(hex, 2)).toBe("0xabcd");
		});

		it("handles empty slice", () => {
			const hex = "0x1234" as BrandedHex;
			expect(Hex.slice(hex, 2, 2)).toBe("0x");
		});
	});

	describe("size", () => {
		it("returns byte size", () => {
			expect(Hex.size("0x" as BrandedHex)).toBe(0);
			expect(Hex.size("0x12" as BrandedHex)).toBe(1);
			expect(Hex.size("0x1234" as BrandedHex)).toBe(2);
			expect(Hex.size("0x1234abcd" as BrandedHex)).toBe(4);
		});
	});

	describe("pad", () => {
		it("pads hex to target size", () => {
			const hex = "0x1234" as BrandedHex;
			expect(Hex.pad(hex, 4)).toBe("0x00001234");
		});

		it("does not pad if already at target size", () => {
			const hex = "0x1234" as BrandedHex;
			expect(Hex.pad(hex, 2)).toBe("0x1234");
		});

		it("does not pad if larger than target size", () => {
			const hex = "0x1234abcd" as BrandedHex;
			expect(Hex.pad(hex, 2)).toBe("0x1234abcd");
		});
	});

	describe("trim", () => {
		it("removes leading zeros", () => {
			expect(Hex.trim("0x00001234" as BrandedHex)).toBe("0x1234");
		});

		it("removes all leading zeros", () => {
			expect(Hex.trim("0x0000" as BrandedHex)).toBe("0x");
		});

		it("does not trim non-zero values", () => {
			expect(Hex.trim("0x1234" as BrandedHex)).toBe("0x1234");
		});
	});

	describe("fromNumber / toNumber", () => {
		it("converts zero", () => {
			expect(Hex.fromNumber(0)).toBe("0x0");
			const hex = "0x00" as BrandedHex;
			expect(Hex.toNumber(hex)).toBe(0);
		});

		it("converts small numbers", () => {
			expect(Hex.fromNumber(1)).toBe("0x1");
			expect(Hex.fromNumber(15)).toBe("0xf");
			expect(Hex.fromNumber(255)).toBe("0xff");
		});

		it("converts larger numbers", () => {
			expect(Hex.fromNumber(0x1234)).toBe("0x1234");
			expect(Hex.fromNumber(0xdeadbeef)).toBe("0xdeadbeef");
		});

		it("converts with size padding", () => {
			expect(Hex.fromNumber(255, 1)).toBe("0xff");
			expect(Hex.fromNumber(255, 2)).toBe("0x00ff");
			expect(Hex.fromNumber(255, 4)).toBe("0x000000ff");
		});

		it("round-trip number conversions", () => {
			const values = [0, 1, 255, 0x1234, 0xabcdef];
			values.forEach((val) => {
				const hex = Hex.fromNumber(val);
				expect(Hex.toNumber(hex)).toBe(val);
			});
		});

		it("throws on unsafe integer", () => {
			const hex = "0xffffffffffffffff" as BrandedHex;
			expect(() => Hex.toNumber(hex)).toThrow(RangeError);
		});
	});

	describe("fromBigInt / toBigInt", () => {
		it("converts zero", () => {
			expect(Hex.fromBigInt(0n)).toBe("0x0");
			const hex = "0x00" as BrandedHex;
			expect(Hex.toBigInt(hex)).toBe(0n);
		});

		it("converts small bigints", () => {
			expect(Hex.fromBigInt(1n)).toBe("0x1");
			expect(Hex.fromBigInt(255n)).toBe("0xff");
			expect(Hex.fromBigInt(0x1234n)).toBe("0x1234");
		});

		it("converts large bigints", () => {
			const large = 0xffffffffffffffffffffffffffffffffn;
			expect(Hex.fromBigInt(large)).toBe("0xffffffffffffffffffffffffffffffff");
		});

		it("converts with size padding", () => {
			expect(Hex.fromBigInt(255n, 1)).toBe("0xff");
			expect(Hex.fromBigInt(255n, 2)).toBe("0x00ff");
			expect(Hex.fromBigInt(255n, 32)).toBe(
				"0x00000000000000000000000000000000000000000000000000000000000000ff",
			);
		});

		it("round-trip bigint conversions", () => {
			const values = [0n, 1n, 255n, 0x1234n, 0xffffffffffffffffn];
			values.forEach((val) => {
				const hex = Hex.fromBigInt(val);
				expect(Hex.toBigInt(hex)).toBe(val);
			});
		});
	});

	describe("fromBoolean / toBoolean", () => {
		it("converts true to 0x01", () => {
			expect(Hex.fromBoolean(true)).toBe("0x01");
		});

		it("converts false to 0x00", () => {
			expect(Hex.fromBoolean(false)).toBe("0x00");
		});

		it("converts 0x01 to true", () => {
			const hex = "0x01" as BrandedHex;
			expect(Hex.toBoolean(hex)).toBe(true);
		});

		it("converts 0x00 to false", () => {
			const hex = "0x00" as BrandedHex;
			expect(Hex.toBoolean(hex)).toBe(false);
		});

		it("converts non-zero values to true", () => {
			expect(Hex.toBoolean("0xff" as BrandedHex)).toBe(true);
			expect(Hex.toBoolean("0x1234" as BrandedHex)).toBe(true);
			expect(Hex.toBoolean("0x000001" as BrandedHex)).toBe(true);
		});

		it("converts all-zero values to false", () => {
			expect(Hex.toBoolean("0x0000" as BrandedHex)).toBe(false);
			expect(Hex.toBoolean("0x00000000" as BrandedHex)).toBe(false);
		});

		it("round-trip boolean conversions", () => {
			expect(Hex.toBoolean(Hex.fromBoolean(true))).toBe(true);
			expect(Hex.toBoolean(Hex.fromBoolean(false))).toBe(false);
		});
	});

	describe("padRight", () => {
		it("pads hex to target size on right", () => {
			const hex = "0x1234" as BrandedHex;
			expect(Hex.padRight(hex, 4)).toBe("0x12340000");
		});

		it("does not pad if already at target size", () => {
			const hex = "0x1234" as BrandedHex;
			expect(Hex.padRight(hex, 2)).toBe("0x1234");
		});

		it("does not pad if larger than target size", () => {
			const hex = "0x1234abcd" as BrandedHex;
			expect(Hex.padRight(hex, 2)).toBe("0x1234abcd");
		});

		it("pads empty hex", () => {
			const hex = "0x" as BrandedHex;
			expect(Hex.padRight(hex, 2)).toBe("0x0000");
		});

		it("pads single byte", () => {
			const hex = "0xff" as BrandedHex;
			expect(Hex.padRight(hex, 4)).toBe("0xff000000");
		});
	});

	describe("equals", () => {
		it("compares equal hex strings", () => {
			const hex1 = "0x1234" as BrandedHex;
			expect(Hex.equals(hex1, "0x1234" as BrandedHex)).toBe(true);
		});

		it("compares case-insensitively", () => {
			const hex1 = "0xabcd" as BrandedHex;
			expect(Hex.equals(hex1, "0xABCD" as BrandedHex)).toBe(true);
			expect(Hex.equals(hex1, "0xAbCd" as BrandedHex)).toBe(true);
		});

		it("returns false for different values", () => {
			const hex1 = "0x1234" as BrandedHex;
			expect(Hex.equals(hex1, "0x5678" as BrandedHex)).toBe(false);
		});

		it("returns false for different lengths", () => {
			const hex1 = "0x12" as BrandedHex;
			expect(Hex.equals(hex1, "0x1234" as BrandedHex)).toBe(false);
		});

		it("compares empty hex strings", () => {
			const hex1 = "0x" as BrandedHex;
			expect(Hex.equals(hex1, "0x" as BrandedHex)).toBe(true);
		});
	});

	describe("xor", () => {
		it("performs XOR on same-length hex strings", () => {
			const hex1 = "0x12" as BrandedHex;
			const hex2 = "0x34" as BrandedHex;
			expect(Hex.xor(hex1, hex2)).toBe("0x26");
		});

		it("performs XOR with all zeros", () => {
			const hex1 = "0xff" as BrandedHex;
			const hex2 = "0x00" as BrandedHex;
			expect(Hex.xor(hex1, hex2)).toBe("0xff");
		});

		it("performs XOR with all ones", () => {
			const hex1 = "0x12" as BrandedHex;
			const hex2 = "0xff" as BrandedHex;
			expect(Hex.xor(hex1, hex2)).toBe("0xed");
		});

		it("performs XOR on multi-byte hex", () => {
			const hex1 = "0x1234" as BrandedHex;
			const hex2 = "0xabcd" as BrandedHex;
			expect(Hex.xor(hex1, hex2)).toBe("0xb9f9");
		});

		it("XOR with itself returns zeros", () => {
			const hex = "0xdeadbeef" as BrandedHex;
			expect(Hex.xor(hex, hex)).toBe("0x00000000");
		});

		it("throws on mismatched lengths", () => {
			const hex1 = "0x12" as BrandedHex;
			const hex2 = "0x1234" as BrandedHex;
			expect(() => Hex.xor(hex1, hex2)).toThrow(InvalidHexLengthError);
		});
	});

	describe("random", () => {
		it("generates random hex of specified size", () => {
			const hex = Hex.random(4);
			expect(hex.startsWith("0x")).toBe(true);
			expect(Hex.size(hex)).toBe(4);
		});

		it("generates different values", () => {
			const hex1 = Hex.random(32);
			const hex2 = Hex.random(32);
			expect(hex1).not.toBe(hex2);
		});

		it("generates valid hex", () => {
			const hex = Hex.random(16);
			expect(Hex.isHex(hex)).toBe(true);
		});

		it("generates zero-size hex", () => {
			const hex = Hex.random(0);
			expect(hex).toBe("0x");
		});

		it("generates single byte", () => {
			const hex = Hex.random(1);
			expect(Hex.size(hex)).toBe(1);
		});
	});

	describe("zero", () => {
		it("creates zero-filled hex of specified size", () => {
			expect(Hex.zero(1)).toBe("0x00");
			expect(Hex.zero(2)).toBe("0x0000");
			expect(Hex.zero(4)).toBe("0x00000000");
		});

		it("creates empty hex for size 0", () => {
			expect(Hex.zero(0)).toBe("0x");
		});

		it("creates large zero-filled hex", () => {
			const hex = Hex.zero(32);
			expect(Hex.size(hex)).toBe(32);
			expect(hex).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});

		it("creates zero hex that converts to 0", () => {
			const hex = Hex.zero(4);
			expect(Hex.toNumber(hex)).toBe(0);
			expect(Hex.toBigInt(hex)).toBe(0n);
			expect(Hex.toBoolean(hex)).toBe(false);
		});
	});

	describe("round-trip conversions", () => {
		it("maintains data integrity", () => {
			const original = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
			const hex = Hex.fromBytes(original);
			const result = Hex.toBytes(hex);
			expect(Array.from(result)).toEqual(Array.from(original));
		});
	});
});
