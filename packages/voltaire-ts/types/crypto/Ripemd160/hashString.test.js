/**
 * Ripemd160.hashString tests
 *
 * Tests for the hashString function covering:
 * - String input handling
 * - UTF-8 encoding correctness
 * - Cross-validation with hash() function
 * - Edge cases and special characters
 */
import { ripemd160 } from "@noble/hashes/legacy.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
describe("Ripemd160 hashString function", () => {
    describe("basic string hashing", () => {
        it("should hash empty string", () => {
            const result = hashString("");
            expect(result.length).toBe(20);
            const hashEmpty = hash(new Uint8Array([]));
            expect(result).toEqual(hashEmpty);
        });
        it("should hash 'hello'", () => {
            const result = hashString("hello");
            expect(result).toEqual(ripemd160(new TextEncoder().encode("hello")));
            expect(result.length).toBe(20);
        });
        it("should hash 'abc'", () => {
            const result = hashString("abc");
            const expected = new Uint8Array([
                0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04, 0x4a, 0x8e,
                0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash 'a'", () => {
            const result = hashString("a");
            const expected = new Uint8Array([
                0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9, 0xda, 0xae, 0x34, 0x7b,
                0xe6, 0xf4, 0xdc, 0x83, 0x5a, 0x46, 0x7f, 0xfe,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash 'The quick brown fox jumps over the lazy dog'", () => {
            const result = hashString("The quick brown fox jumps over the lazy dog");
            const expected = new Uint8Array([
                0x37, 0xf3, 0x32, 0xf6, 0x8d, 0xb7, 0x7b, 0xd9, 0xd7, 0xed, 0xd4, 0x96,
                0x95, 0x71, 0xad, 0x67, 0x1c, 0xf9, 0xdd, 0x3b,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash 'message digest'", () => {
            const result = hashString("message digest");
            const expected = new Uint8Array([
                0x5d, 0x06, 0x89, 0xef, 0x49, 0xd2, 0xfa, 0xe5, 0x72, 0xb8, 0x81, 0xb1,
                0x23, 0xa8, 0x5f, 0xfa, 0x21, 0x59, 0x5f, 0x36,
            ]);
            expect(result).toEqual(expected);
        });
    });
    describe("UTF-8 encoding", () => {
        it("should handle UTF-8 strings correctly", () => {
            const result = hashString("Hello 世界 🌍");
            const manualBytes = new TextEncoder().encode("Hello 世界 🌍");
            const hashFromBytes = hash(manualBytes);
            expect(result).toEqual(hashFromBytes);
        });
        it("should handle emoji", () => {
            const result = hashString("🚀🔥💯");
            const manualBytes = new TextEncoder().encode("🚀🔥💯");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should handle Chinese characters", () => {
            const result = hashString("中文测试");
            const manualBytes = new TextEncoder().encode("中文测试");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should handle Arabic characters", () => {
            const result = hashString("مرحبا");
            const manualBytes = new TextEncoder().encode("مرحبا");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should handle mixed Unicode", () => {
            const result = hashString("Hello世界🌍مرحبا");
            const manualBytes = new TextEncoder().encode("Hello世界🌍مرحبا");
            expect(result).toEqual(hash(manualBytes));
        });
    });
    describe("determinism", () => {
        it("should be deterministic", () => {
            const str = "test string";
            const hash1 = hashString(str);
            const hash2 = hashString(str);
            expect(hash1).toEqual(hash2);
        });
        it("should produce different hashes for different strings", () => {
            const hash1 = hashString("test1");
            const hash2 = hashString("test2");
            const hash3 = hashString("test12");
            expect(hash1).not.toEqual(hash2);
            expect(hash1).not.toEqual(hash3);
            expect(hash2).not.toEqual(hash3);
        });
    });
    describe("equivalence with hash()", () => {
        it("should match hash() for string input", () => {
            const str = "test";
            const result1 = hashString(str);
            const result2 = hash(str);
            expect(result1).toEqual(result2);
        });
        it("should match hash() for various strings", () => {
            const strings = [
                "",
                "a",
                "abc",
                "hello",
                "message digest",
                "The quick brown fox jumps over the lazy dog",
            ];
            for (const str of strings) {
                expect(hashString(str)).toEqual(hash(str));
            }
        });
        it("should match hash() with byte encoding", () => {
            const testStrings = ["test", "hello", "", "a", "The quick brown fox"];
            for (const str of testStrings) {
                const result = hashString(str);
                const expected = hash(new TextEncoder().encode(str));
                expect(result).toEqual(expected);
            }
        });
    });
    describe("special characters", () => {
        it("should hash newline characters", () => {
            const result = hashString("line1\nline2");
            const manualBytes = new TextEncoder().encode("line1\nline2");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should hash tab characters", () => {
            const result = hashString("col1\tcol2");
            const manualBytes = new TextEncoder().encode("col1\tcol2");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should hash null byte (U+0000)", () => {
            const result = hashString("before\u0000after");
            const manualBytes = new TextEncoder().encode("before\u0000after");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should hash control characters", () => {
            const result = hashString("\x01\x02\x03");
            const manualBytes = new TextEncoder().encode("\x01\x02\x03");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should hash carriage return and line feed", () => {
            const result = hashString("line1\r\nline2");
            const manualBytes = new TextEncoder().encode("line1\r\nline2");
            expect(result).toEqual(hash(manualBytes));
        });
    });
    describe("edge cases", () => {
        it("should hash very long string", () => {
            const longString = "a".repeat(10000);
            const result = hashString(longString);
            expect(result.length).toBe(20);
            const result2 = hashString(longString);
            expect(result).toEqual(result2);
        });
        it("should hash string with only spaces", () => {
            const result = hashString("   ");
            const manualBytes = new TextEncoder().encode("   ");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should distinguish similar strings", () => {
            const hash1 = hashString("test ");
            const hash2 = hashString(" test");
            const hash3 = hashString("test");
            expect(hash1).not.toEqual(hash2);
            expect(hash1).not.toEqual(hash3);
            expect(hash2).not.toEqual(hash3);
        });
        it("should hash repeated characters", () => {
            const result = hashString("aaaaaaaaaa");
            const manualBytes = new TextEncoder().encode("aaaaaaaaaa");
            expect(result).toEqual(hash(manualBytes));
        });
        it("should hash multiline text", () => {
            const text = `Line 1
Line 2
Line 3`;
            const result = hashString(text);
            const manualBytes = new TextEncoder().encode(text);
            expect(result).toEqual(hash(manualBytes));
        });
    });
    describe("official test vectors", () => {
        it("should match test vector for empty string", () => {
            const result = hashString("");
            const expected = new Uint8Array([
                0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28, 0x08, 0x97,
                0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
            ]);
            expect(result).toEqual(expected);
        });
        it("should match test vector for lowercase alphabet", () => {
            const result = hashString("abcdefghijklmnopqrstuvwxyz");
            const expected = new Uint8Array([
                0xf7, 0x1c, 0x27, 0x10, 0x9c, 0x69, 0x2c, 0x1b, 0x56, 0xbb, 0xdc, 0xeb,
                0x5b, 0x9d, 0x28, 0x65, 0xb3, 0x70, 0x8d, 0xbc,
            ]);
            expect(result).toEqual(expected);
        });
        it("should match test vector for mixed case alphanumeric", () => {
            const result = hashString("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
            const expected = new Uint8Array([
                0xb0, 0xe2, 0x0b, 0x6e, 0x31, 0x16, 0x64, 0x02, 0x86, 0xed, 0x3a, 0x87,
                0xa5, 0x71, 0x30, 0x79, 0xb2, 0x1f, 0x51, 0x89,
            ]);
            expect(result).toEqual(expected);
        });
        it("should match test vector for repeated digits", () => {
            const result = hashString("12345678901234567890123456789012345678901234567890123456789012345678901234567890");
            const expected = new Uint8Array([
                0x9b, 0x75, 0x2e, 0x45, 0x57, 0x3d, 0x4b, 0x39, 0xf4, 0xdb, 0xd3, 0x32,
                0x3c, 0xab, 0x82, 0xbf, 0x63, 0x32, 0x6b, 0xfb,
            ]);
            expect(result).toEqual(expected);
        });
    });
    describe("cross-validation with @noble/hashes", () => {
        it("should match @noble for various strings", () => {
            const strings = [
                "",
                "a",
                "abc",
                "hello",
                "message digest",
                "The quick brown fox jumps over the lazy dog",
                "Hello 世界 🌍",
            ];
            for (const str of strings) {
                const result = hashString(str);
                const expected = ripemd160(new TextEncoder().encode(str));
                expect(result).toEqual(expected);
            }
        });
        it("should match @noble for UTF-8 strings", () => {
            const strings = ["Hello 世界 🌍", "🚀🔥💯", "中文测试", "مرحبا"];
            for (const str of strings) {
                const result = hashString(str);
                const expected = ripemd160(new TextEncoder().encode(str));
                expect(result).toEqual(expected);
            }
        });
        it("should match @noble for long strings", () => {
            const longString = "test".repeat(1000);
            const result = hashString(longString);
            const expected = ripemd160(new TextEncoder().encode(longString));
            expect(result).toEqual(expected);
        });
    });
    describe("common use cases", () => {
        it("should hash file path", () => {
            const result = hashString("/path/to/file.txt");
            expect(result.length).toBe(20);
        });
        it("should hash URL", () => {
            const result = hashString("https://example.com/path?query=value");
            expect(result.length).toBe(20);
        });
        it("should hash JSON", () => {
            const json = JSON.stringify({ key: "value", number: 42 });
            const result = hashString(json);
            expect(result.length).toBe(20);
        });
        it("should hash Bitcoin address data", () => {
            const addressData = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
            const result = hashString(addressData);
            expect(result.length).toBe(20);
        });
        it("should hash script data", () => {
            const script = "OP_DUP OP_HASH160 ... OP_EQUALVERIFY OP_CHECKSIG";
            const result = hashString(script);
            expect(result.length).toBe(20);
        });
    });
    describe("case sensitivity", () => {
        it("should distinguish between uppercase and lowercase", () => {
            const hash1 = hashString("test");
            const hash2 = hashString("TEST");
            const hash3 = hashString("Test");
            expect(hash1).not.toEqual(hash2);
            expect(hash1).not.toEqual(hash3);
            expect(hash2).not.toEqual(hash3);
        });
        it("should hash case-sensitive paths differently", () => {
            const hash1 = hashString("/Path/To/File");
            const hash2 = hashString("/path/to/file");
            expect(hash1).not.toEqual(hash2);
        });
    });
});
