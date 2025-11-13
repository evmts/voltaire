import { describe, expect, it } from "vitest";
import * as Base64 from "./index.js";

describe("Base64", () => {
	describe("Standard Encoding", () => {
		it("encode should encode bytes to base64", () => {
			const data = new Uint8Array([72, 101, 108, 108, 111]);
			const encoded = Base64.encode(data);
			expect(encoded).toBe("SGVsbG8=");
		});

		it("encode should handle empty input", () => {
			const empty = new Uint8Array(0);
			expect(Base64.encode(empty)).toBe("");
		});

		it("encode should handle all bytes", () => {
			const data = new Uint8Array([0, 255, 128, 64]);
			const encoded = Base64.encode(data);
			expect(Base64.decode(encoded)).toEqual(data);
		});

		it("encodeString should encode UTF-8 strings", () => {
			expect(Base64.encodeString("Hello")).toBe("SGVsbG8=");
			expect(Base64.encodeString("Hello, world!")).toBe("SGVsbG8sIHdvcmxkIQ==");
		});
	});

	describe("Standard Decoding", () => {
		it("decode should decode base64 to bytes", () => {
			const decoded = Base64.decode("SGVsbG8=");
			expect(decoded).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
		});

		it("decode should handle empty input", () => {
			expect(Base64.decode("")).toEqual(new Uint8Array(0));
		});

		it("decode should throw on invalid base64", () => {
			expect(() => Base64.decode("!!!")).toThrow();
		});

		it("decodeToString should decode to UTF-8", () => {
			expect(Base64.decodeToString("SGVsbG8=")).toBe("Hello");
			expect(Base64.decodeToString("SGVsbG8sIHdvcmxkIQ==")).toBe(
				"Hello, world!",
			);
		});
	});

	describe("URL-Safe Encoding", () => {
		it("encodeUrlSafe should use URL-safe alphabet", () => {
			const data = new Uint8Array([255, 254, 253]);
			const encoded = Base64.encodeUrlSafe(data);

			expect(encoded).not.toContain("+");
			expect(encoded).not.toContain("/");
			expect(encoded).not.toContain("=");
		});

		it("encodeUrlSafe should be reversible", () => {
			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const encoded = Base64.encodeUrlSafe(data);
			const decoded = Base64.decodeUrlSafe(encoded);
			expect(decoded).toEqual(data);
		});

		it("encodeStringUrlSafe should encode strings", () => {
			const encoded = Base64.encodeStringUrlSafe("test");
			expect(encoded).not.toContain("=");
			expect(Base64.decodeUrlSafeToString(encoded)).toBe("test");
		});
	});

	describe("URL-Safe Decoding", () => {
		it("decodeUrlSafe should handle no padding", () => {
			const encoded = Base64.encodeUrlSafe(new Uint8Array([1, 2, 3]));
			const decoded = Base64.decodeUrlSafe(encoded);
			expect(decoded).toEqual(new Uint8Array([1, 2, 3]));
		});

		it("decodeUrlSafe should handle - and _", () => {
			const data = new Uint8Array([255, 254, 253]);
			const encoded = Base64.encodeUrlSafe(data);
			const decoded = Base64.decodeUrlSafe(encoded);
			expect(decoded).toEqual(data);
		});
	});

	describe("Round-trip", () => {
		it("should preserve data through encode/decode", () => {
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

		it("should preserve data through URL-safe encode/decode", () => {
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

		it("should preserve strings", () => {
			const strings = ["", "a", "Hello", "Hello, world!", "🚀"];

			for (const str of strings) {
				const encoded = Base64.encodeString(str);
				const decoded = Base64.decodeToString(encoded);
				expect(decoded).toBe(str);
			}
		});
	});

	describe("Validation", () => {
		it("isValid should accept valid base64", () => {
			expect(Base64.isValid("")).toBe(true);
			expect(Base64.isValid("SGVsbG8=")).toBe(true);
			expect(Base64.isValid("SGVsbG8sIHdvcmxkIQ==")).toBe(true);
		});

		it("isValid should reject invalid base64", () => {
			expect(Base64.isValid("!!!")).toBe(false);
			expect(Base64.isValid("SGVsbG8")).toBe(false);
		});

		it("isValidUrlSafe should accept valid URL-safe base64", () => {
			expect(Base64.isValidUrlSafe("")).toBe(true);
			expect(Base64.isValidUrlSafe("SGVsbG8")).toBe(true);
			expect(Base64.isValidUrlSafe("YWJj")).toBe(true);
			expect(Base64.isValidUrlSafe("_-_-")).toBe(true);
		});

		it("isValidUrlSafe should reject invalid URL-safe base64", () => {
			expect(Base64.isValidUrlSafe("SGVsbG8=")).toBe(false);
			expect(Base64.isValidUrlSafe("+++")).toBe(false);
			expect(Base64.isValidUrlSafe("///")).toBe(false);
		});
	});

	describe("Size Calculation", () => {
		it("calcEncodedSize should calculate correct size", () => {
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

	describe("Known Test Vectors", () => {
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

	describe("Branded Types", () => {
		describe("from", () => {
			it("should create BrandedBase64 from valid string", () => {
				const b64 = Base64.from("SGVsbG8=");
				expect(b64).toBe("SGVsbG8=");
				expect(Base64.isValid(b64)).toBe(true);
			});

			it("should create BrandedBase64 from bytes", () => {
				const data = new Uint8Array([72, 101, 108, 108, 111]);
				const b64 = Base64.from(data);
				expect(b64).toBe("SGVsbG8=");
			});

			it("should throw on invalid string", () => {
				expect(() => Base64.from("!!!")).toThrow(TypeError);
				expect(() => Base64.from("SGVsbG8")).toThrow(TypeError);
			});
		});

		describe("fromUrlSafe", () => {
			it("should create BrandedBase64Url from valid string", () => {
				const b64url = Base64.fromUrlSafe("SGVsbG8");
				expect(b64url).toBe("SGVsbG8");
				expect(Base64.isValidUrlSafe(b64url)).toBe(true);
			});

			it("should create BrandedBase64Url from bytes", () => {
				const data = new Uint8Array([72, 101, 108, 108, 111]);
				const b64url = Base64.fromUrlSafe(data);
				expect(Base64.isValidUrlSafe(b64url)).toBe(true);
			});

			it("should throw on invalid string", () => {
				expect(() => Base64.fromUrlSafe("SGVsbG8=")).toThrow(TypeError);
				expect(() => Base64.fromUrlSafe("+++")).toThrow(TypeError);
			});
		});

		describe("toBytes", () => {
			it("should convert BrandedBase64 to bytes", () => {
				const b64 = Base64.from("SGVsbG8=");
				const bytes = Base64.toBytes(b64);
				expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
			});
		});

		describe("toBytesUrlSafe", () => {
			it("should convert BrandedBase64Url to bytes", () => {
				const b64url = Base64.fromUrlSafe("SGVsbG8");
				const bytes = Base64.toBytesUrlSafe(b64url);
				expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
			});
		});

		describe("toString", () => {
			it("should strip branding", () => {
				const b64 = Base64.from("SGVsbG8=");
				const str = Base64.toString(b64);
				expect(str).toBe("SGVsbG8=");
				expect(typeof str).toBe("string");
			});
		});

		describe("toStringUrlSafe", () => {
			it("should strip branding", () => {
				const b64url = Base64.fromUrlSafe("SGVsbG8");
				const str = Base64.toStringUrlSafe(b64url);
				expect(str).toBe("SGVsbG8");
				expect(typeof str).toBe("string");
			});
		});

		describe("toBase64Url", () => {
			it("should convert Base64 to Base64Url", () => {
				const b64 = Base64.from("SGVsbG8=");
				const b64url = Base64.toBase64Url(b64);
				expect(Base64.isValidUrlSafe(b64url)).toBe(true);
				expect(b64url).not.toContain("=");
			});
		});

		describe("toBase64", () => {
			it("should convert Base64Url to Base64", () => {
				const b64url = Base64.fromUrlSafe("SGVsbG8");
				const b64 = Base64.toBase64(b64url);
				expect(Base64.isValid(b64)).toBe(true);
				expect(b64).toBe("SGVsbG8=");
			});
		});

		describe("Round-trip with branded types", () => {
			it("should preserve data through Base64 branded round-trip", () => {
				const original = new Uint8Array([1, 2, 3, 4, 5]);
				const b64 = Base64.from(original);
				const bytes = Base64.toBytes(b64);
				expect(bytes).toEqual(original);
			});

			it("should preserve data through Base64Url branded round-trip", () => {
				const original = new Uint8Array([255, 254, 253]);
				const b64url = Base64.fromUrlSafe(original);
				const bytes = Base64.toBytesUrlSafe(b64url);
				expect(bytes).toEqual(original);
			});

			it("should convert between Base64 and Base64Url", () => {
				const original = new Uint8Array([1, 2, 3, 4, 5]);
				const b64 = Base64.from(original);
				const b64url = Base64.toBase64Url(b64);
				const b64Again = Base64.toBase64(b64url);
				const bytes = Base64.toBytes(b64Again);
				expect(bytes).toEqual(original);
			});
		});

		describe("Type safety", () => {
			it("should work with already branded values", () => {
				const b64 = Base64.from("SGVsbG8=");
				const b64Again = Base64.from(b64);
				expect(b64Again).toBe(b64);
			});

			it("should work with already branded URL-safe values", () => {
				const b64url = Base64.fromUrlSafe("SGVsbG8");
				const b64urlAgain = Base64.fromUrlSafe(b64url);
				expect(b64urlAgain).toBe(b64url);
			});
		});
	});
});
