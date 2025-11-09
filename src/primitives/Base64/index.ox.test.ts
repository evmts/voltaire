import { describe, expect, it } from "vitest";
import * as Base64 from "./index.ox.js";

describe("Base64 (Ox Implementation)", () => {
	describe("Ox Core Functions - Encoding", () => {
		it("fromBytes should encode bytes to base64", () => {
			const data = new Uint8Array([72, 101, 108, 108, 111]);
			const encoded = Base64.fromBytes(data);
			expect(encoded).toBe("SGVsbG8=");
		});

		it("fromHex should encode hex to base64", () => {
			const hex = "0x48656c6c6f" as const;
			const encoded = Base64.fromHex(hex);
			expect(encoded).toBe("SGVsbG8=");
		});

		it("fromString should encode string to base64", () => {
			expect(Base64.fromString("Hello")).toBe("SGVsbG8=");
			expect(Base64.fromString("Hello, world!")).toBe("SGVsbG8sIHdvcmxkIQ==");
		});

		it("fromBytes should handle empty input", () => {
			const empty = new Uint8Array(0);
			expect(Base64.fromBytes(empty)).toBe("");
		});

		it("fromBytes with url option should use URL-safe alphabet", () => {
			const data = new Uint8Array([255, 254, 253]);
			const encoded = Base64.fromBytes(data, { url: true });
			expect(encoded).not.toContain("+");
			expect(encoded).not.toContain("/");
		});

		it("fromBytes with pad: false should omit padding", () => {
			const encoded = Base64.fromString("Hello", { pad: false });
			expect(encoded).toBe("SGVsbG8");
		});
	});

	describe("Ox Core Functions - Decoding", () => {
		it("toBytes should decode base64 to bytes", () => {
			const decoded = Base64.toBytes("SGVsbG8=");
			expect(decoded).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
		});

		it("toHex should decode base64 to hex", () => {
			const hex = Base64.toHex("SGVsbG8=");
			expect(hex).toBe("0x48656c6c6f");
		});

		it("toString should decode base64 to string", () => {
			expect(Base64.toString("SGVsbG8=")).toBe("Hello");
			expect(Base64.toString("SGVsbG8sIHdvcmxkIQ==")).toBe("Hello, world!");
		});

		it("toBytes should handle empty input", () => {
			expect(Base64.toBytes("")).toEqual(new Uint8Array(0));
		});

		it("toBytes should handle URL-safe input (no padding)", () => {
			const encoded = Base64.fromString("Hello", { url: true, pad: false });
			const decoded = Base64.toBytes(encoded);
			expect(decoded).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
		});
	});

	describe("Voltaire Compatibility Aliases", () => {
		it("encode should work as alias for fromBytes", () => {
			const data = new Uint8Array([72, 101, 108, 108, 111]);
			expect(Base64.encode(data)).toBe("SGVsbG8=");
		});

		it("decode should work as alias for toBytes", () => {
			const decoded = Base64.decode("SGVsbG8=");
			expect(decoded).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
		});

		it("encodeString should work as alias for fromString", () => {
			expect(Base64.encodeString("Hello")).toBe("SGVsbG8=");
		});

		it("decodeToString should work as alias for toString", () => {
			expect(Base64.decodeToString("SGVsbG8=")).toBe("Hello");
		});
	});

	describe("URL-Safe Extensions", () => {
		it("encodeUrlSafe should encode bytes without padding or special chars", () => {
			const data = new Uint8Array([255, 254, 253]);
			const encoded = Base64.encodeUrlSafe(data);
			expect(encoded).not.toContain("=");
			expect(encoded).not.toContain("+");
			expect(encoded).not.toContain("/");
		});

		it("decodeUrlSafe should decode URL-safe base64", () => {
			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const encoded = Base64.encodeUrlSafe(data);
			const decoded = Base64.decodeUrlSafe(encoded);
			expect(decoded).toEqual(data);
		});

		it("encodeStringUrlSafe should encode strings without padding", () => {
			const encoded = Base64.encodeStringUrlSafe("test");
			expect(encoded).not.toContain("=");
			expect(Base64.decodeUrlSafeToString(encoded)).toBe("test");
		});

		it("decodeUrlSafeToString should decode URL-safe to string", () => {
			const encoded = Base64.encodeStringUrlSafe("Hello, world!");
			expect(Base64.decodeUrlSafeToString(encoded)).toBe("Hello, world!");
		});
	});

	describe("Validation Extensions", () => {
		it("isValid should validate standard base64", () => {
			expect(Base64.isValid("")).toBe(true);
			expect(Base64.isValid("SGVsbG8=")).toBe(true);
			expect(Base64.isValid("SGVsbG8sIHdvcmxkIQ==")).toBe(true);
		});

		it("isValid should reject invalid base64", () => {
			expect(Base64.isValid("!!!")).toBe(false);
			expect(Base64.isValid("SGVsbG8")).toBe(false); // Missing padding
		});

		it("isValidUrlSafe should validate URL-safe base64", () => {
			expect(Base64.isValidUrlSafe("")).toBe(true);
			expect(Base64.isValidUrlSafe("SGVsbG8")).toBe(true);
			expect(Base64.isValidUrlSafe("YWJj")).toBe(true);
			expect(Base64.isValidUrlSafe("_-_-")).toBe(true);
		});

		it("isValidUrlSafe should reject standard base64 (padding)", () => {
			expect(Base64.isValidUrlSafe("SGVsbG8=")).toBe(false);
		});
	});

	describe("Size Calculation Extensions", () => {
		it("calcEncodedSize should calculate encoded size correctly", () => {
			expect(Base64.calcEncodedSize(0)).toBe(0);
			expect(Base64.calcEncodedSize(1)).toBe(4);
			expect(Base64.calcEncodedSize(2)).toBe(4);
			expect(Base64.calcEncodedSize(3)).toBe(4);
			expect(Base64.calcEncodedSize(4)).toBe(8);
			expect(Base64.calcEncodedSize(5)).toBe(8);
		});

		it("calcDecodedSize should estimate decoded size", () => {
			expect(Base64.calcDecodedSize(0)).toBe(0);
			expect(Base64.calcDecodedSize(4)).toBe(1);
			expect(Base64.calcDecodedSize(8)).toBe(4);
		});
	});

	describe("Round-trip Encoding/Decoding", () => {
		it("should preserve bytes through encode/decode", () => {
			const cases = [
				new Uint8Array([]),
				new Uint8Array([0]),
				new Uint8Array([255]),
				new Uint8Array([1, 2, 3, 4, 5]),
				new Uint8Array(Array.from({ length: 100 }, (_, i) => i)),
			];

			for (const data of cases) {
				const encoded = Base64.encode(data);
				const decoded = Base64.decode(encoded);
				expect(decoded).toEqual(data);
			}
		});

		it("should preserve strings through encodeString/decodeToString", () => {
			const strings = ["", "a", "Hello", "Hello, world!", "🚀"];

			for (const str of strings) {
				const encoded = Base64.encodeString(str);
				const decoded = Base64.decodeToString(encoded);
				expect(decoded).toBe(str);
			}
		});

		it("should preserve bytes through URL-safe encode/decode", () => {
			const cases = [
				new Uint8Array([]),
				new Uint8Array([0]),
				new Uint8Array([255]),
				new Uint8Array([1, 2, 3, 4, 5]),
				new Uint8Array([255, 254, 253, 252, 251]),
			];

			for (const data of cases) {
				const encoded = Base64.encodeUrlSafe(data);
				const decoded = Base64.decodeUrlSafe(encoded);
				expect(decoded).toEqual(data);
			}
		});
	});

	describe("RFC 4648 Compliance", () => {
		it("should match RFC 4648 test vectors", () => {
			const vectors = [
				{ input: "", output: "" },
				{ input: "f", output: "Zg==" },
				{ input: "fo", output: "Zm8=" },
				{ input: "foo", output: "Zm9v" },
				{ input: "foob", output: "Zm9vYg==" },
				{ input: "fooba", output: "Zm9vYmE=" },
				{ input: "foobar", output: "Zm9vYmFy" },
			];

			for (const { input, output } of vectors) {
				expect(Base64.encodeString(input)).toBe(output);
				expect(Base64.decodeToString(output)).toBe(input);
			}
		});
	});

	describe("Ox API Compatibility", () => {
		it("fromBytes with options should work", () => {
			const data = new Uint8Array([72, 101, 108, 108, 111]);
			const standard = Base64.fromBytes(data);
			const noPad = Base64.fromBytes(data, { pad: false });

			expect(standard).toBe("SGVsbG8=");
			expect(noPad).toBe("SGVsbG8");
		});

		it("fromString with options should work", () => {
			const standard = Base64.fromString("test");
			const noPad = Base64.fromString("test", { pad: false });

			expect(standard).toBe("dGVzdA==");
			expect(standard).toContain("=");
			expect(noPad).toBe("dGVzdA");
		});
	});
});
