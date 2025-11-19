import { describe, expect, it } from "vitest";
import * as EncodedData from "./index.js";

describe("EncodedData", () => {
	describe("from", () => {
		it("creates EncodedData from hex string", () => {
			const data = EncodedData.from("0x00000001");
			expect(data).toBe("0x00000001");
		});

		it("accepts uppercase hex", () => {
			const data = EncodedData.from("0xABCDEF");
			expect(data).toBe("0xABCDEF");
		});

		it("accepts empty hex", () => {
			const data = EncodedData.from("0x");
			expect(data).toBe("0x");
		});

		it("creates EncodedData from Uint8Array", () => {
			const bytes = new Uint8Array([0, 0, 0, 1]);
			const data = EncodedData.from(bytes);
			expect(data).toBe("0x00000001");
		});

		it("throws on missing 0x prefix", () => {
			expect(() => EncodedData.from("00000001" as any)).toThrow(
				"must start with 0x",
			);
		});

		it("throws on invalid hex characters", () => {
			expect(() => EncodedData.from("0xghijk" as any)).toThrow(
				"Invalid hex string",
			);
		});

		it("throws on invalid type", () => {
			expect(() => EncodedData.from(123 as any)).toThrow(
				"Unsupported EncodedData value type",
			);
		});
	});

	describe("fromBytes", () => {
		it("creates EncodedData from bytes", () => {
			const bytes = new Uint8Array([1, 2, 3, 4]);
			const data = EncodedData.fromBytes(bytes);
			expect(data).toBe("0x01020304");
		});

		it("handles empty bytes", () => {
			const bytes = new Uint8Array(0);
			const data = EncodedData.fromBytes(bytes);
			expect(data).toBe("0x");
		});

		it("preserves all bytes", () => {
			const bytes = new Uint8Array([0, 255, 16, 240]);
			const data = EncodedData.fromBytes(bytes);
			expect(data).toBe("0x00ff10f0");
		});
	});

	describe("toBytes", () => {
		it("converts EncodedData to bytes", () => {
			const data = EncodedData.from("0x01020304");
			const bytes = EncodedData.toBytes(data);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(Array.from(bytes)).toEqual([1, 2, 3, 4]);
		});

		it("handles empty data", () => {
			const data = EncodedData.from("0x");
			const bytes = EncodedData.toBytes(data);
			expect(bytes.length).toBe(0);
		});

		it("handles uppercase hex", () => {
			const data = EncodedData.from("0xABCDEF");
			const bytes = EncodedData.toBytes(data);
			expect(Array.from(bytes)).toEqual([0xab, 0xcd, 0xef]);
		});
	});

	describe("equals", () => {
		it("returns true for equal data", () => {
			const data1 = EncodedData.from("0x12345678");
			const data2 = EncodedData.from("0x12345678");
			expect(EncodedData.equals(data1, data2)).toBe(true);
		});

		it("returns true for case-insensitive match", () => {
			const data1 = EncodedData.from("0xabcdef");
			const data2 = EncodedData.from("0xABCDEF");
			expect(EncodedData.equals(data1, data2)).toBe(true);
		});

		it("returns false for different data", () => {
			const data1 = EncodedData.from("0x12345678");
			const data2 = EncodedData.from("0x87654321");
			expect(EncodedData.equals(data1, data2)).toBe(false);
		});

		it("returns false for different lengths", () => {
			const data1 = EncodedData.from("0x1234");
			const data2 = EncodedData.from("0x123456");
			expect(EncodedData.equals(data1, data2)).toBe(false);
		});

		it("returns true for empty data", () => {
			const data1 = EncodedData.from("0x");
			const data2 = EncodedData.from("0x");
			expect(EncodedData.equals(data1, data2)).toBe(true);
		});
	});

	describe("roundtrip", () => {
		it("bytes -> hex -> bytes", () => {
			const original = new Uint8Array([1, 2, 3, 4, 5]);
			const encoded = EncodedData.fromBytes(original);
			const decoded = EncodedData.toBytes(encoded);
			expect(Array.from(decoded)).toEqual(Array.from(original));
		});

		it("hex -> bytes -> hex", () => {
			const original = "0xabcdef123456";
			const encoded = EncodedData.from(original);
			const bytes = EncodedData.toBytes(encoded);
			const roundtrip = EncodedData.fromBytes(bytes);
			expect(
				EncodedData.equals(roundtrip, encoded as EncodedData.EncodedDataType),
			).toBe(true);
		});
	});
});
