import { describe, it, expect } from "vitest";
import { toBytes } from "./toBytes.js";

describe("Hex.toBytes", () => {
	describe("basic conversion", () => {
		it("converts 0x to empty bytes", () => {
			const bytes = toBytes("0x");
			expect(bytes).toEqual(new Uint8Array([]));
		});

		it("converts single byte", () => {
			const bytes = toBytes("0x12");
			expect(bytes).toEqual(new Uint8Array([0x12]));
		});

		it("converts multiple bytes", () => {
			const bytes = toBytes("0x12345678");
			expect(bytes).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
		});

		it("converts large hex string", () => {
			const hex =
				"0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
			const bytes = toBytes(hex);
			const expected = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				expected[i] = i;
			}
			expect(bytes).toEqual(expected);
		});
	});

	describe("case insensitivity", () => {
		it("converts lowercase hex", () => {
			const bytes = toBytes("0xabcdef");
			expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
		});

		it("converts uppercase hex", () => {
			const bytes = toBytes("0xABCDEF");
			expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
		});

		it("converts mixed case hex", () => {
			const bytes = toBytes("0xAbCdEf");
			expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
		});

		it("converts all hex digits mixed case", () => {
			const bytes = toBytes("0x0123456789aBcDeF");
			expect(bytes).toEqual(
				new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]),
			);
		});
	});

	describe("edge cases", () => {
		it("converts all zeros", () => {
			const bytes = toBytes("0x00000000");
			expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0]));
		});

		it("converts all ones", () => {
			const bytes = toBytes("0xffffffff");
			expect(bytes).toEqual(new Uint8Array([255, 255, 255, 255]));
		});

		it("converts max byte value", () => {
			const bytes = toBytes("0xff");
			expect(bytes).toEqual(new Uint8Array([0xff]));
		});

		it("converts min byte value", () => {
			const bytes = toBytes("0x00");
			expect(bytes).toEqual(new Uint8Array([0x00]));
		});

		it("converts alternating pattern", () => {
			const bytes = toBytes("0xaa55aa55");
			expect(bytes).toEqual(new Uint8Array([0xaa, 0x55, 0xaa, 0x55]));
		});
	});

	describe("known decodings", () => {
		it("converts ASCII Hello", () => {
			const bytes = toBytes("0x48656c6c6f");
			expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
		});

		it("converts Ethereum address", () => {
			const bytes = toBytes("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
			expect(bytes).toEqual(
				new Uint8Array([
					0xd8, 0xda, 0x6b, 0xf2, 0x69, 0x64, 0xaf, 0x9d, 0x7e, 0xed, 0x9e, 0x03,
					0xe5, 0x34, 0x15, 0xd3, 0x7a, 0xa9, 0x60, 0x45,
				]),
			);
		});

		it("converts keccak256 hash", () => {
			const bytes = toBytes(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
			expect(bytes).toEqual(
				new Uint8Array([
					0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2,
					0xdc, 0xc7, 0x03, 0xc0, 0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
					0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
				]),
			);
		});

		it("converts function selector", () => {
			const bytes = toBytes("0xa9059cbb"); // transfer(address,uint256)
			expect(bytes).toEqual(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
		});
	});

	describe("error handling", () => {
		it("throws on missing 0x prefix", () => {
			expect(() => toBytes("1234")).toThrow("missing 0x prefix");
		});

		it("throws on odd length", () => {
			expect(() => toBytes("0x123")).toThrow("odd number of digits");
		});

		it("throws on invalid hex character - G", () => {
			expect(() => toBytes("0xGG")).toThrow("Invalid hex character");
		});

		it("throws on invalid hex character - space", () => {
			expect(() => toBytes("0x12 34")).toThrow("Invalid hex character");
		});

		it("throws on invalid hex character - special", () => {
			expect(() => toBytes("0x12@34")).toThrow("Invalid hex character");
		});

		it("throws on invalid hex character - unicode", () => {
			expect(() => toBytes("0x12€34")).toThrow("Invalid hex character");
		});

		it("provides position info in error", () => {
			try {
				toBytes("0x12GG");
			} catch (error) {
				expect(error.message).toContain("position");
				expect(error.code).toBe("HEX_INVALID_CHARACTER");
			}
		});
	});

	describe("round-trip", () => {
		it("round-trips with fromBytes", () => {
			const original = "0x12345678";
			const bytes = toBytes(original);
			expect(bytes).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
		});

		it("preserves all byte values", () => {
			const hex = "0x0102037f80ff";
			const bytes = toBytes(hex);
			expect(bytes).toEqual(new Uint8Array([1, 2, 3, 127, 128, 255]));
		});

		it("handles uppercase input", () => {
			const bytes = toBytes("0xDEADBEEF");
			expect(bytes).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
		});
	});

	describe("padding preservation", () => {
		it("preserves leading zeros", () => {
			const bytes = toBytes("0x000001");
			expect(bytes).toEqual(new Uint8Array([0x00, 0x00, 0x01]));
		});

		it("preserves trailing zeros", () => {
			const bytes = toBytes("0x010000");
			expect(bytes).toEqual(new Uint8Array([0x01, 0x00, 0x00]));
		});

		it("preserves middle zeros", () => {
			const bytes = toBytes("0x010002");
			expect(bytes).toEqual(new Uint8Array([0x01, 0x00, 0x02]));
		});
	});

	describe("type safety", () => {
		it("accepts HexType branded string", () => {
			const hex = "0x1234";
			const bytes = toBytes(hex);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		it("returns plain Uint8Array", () => {
			const bytes = toBytes("0x1234");
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.constructor).toBe(Uint8Array);
		});
	});
});
