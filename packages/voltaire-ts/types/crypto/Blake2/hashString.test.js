/**
 * Blake2.hashString tests
 *
 * Tests for the hashString function covering:
 * - String input handling
 * - UTF-8 encoding correctness
 * - Variable output lengths
 * - Cross-validation with hash() function
 */
import { blake2b } from "@noble/hashes/blake2.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
describe("Blake2 hashString function", () => {
    describe("basic string hashing", () => {
        it("should hash string with default 64-byte output", () => {
            const result = hashString("abc");
            expect(result.length).toBe(64);
        });
        it("should hash empty string", () => {
            const result = hashString("");
            expect(result.length).toBe(64);
            const hashEmpty = hash(new Uint8Array([]));
            expect(result).toEqual(hashEmpty);
        });
        it("should hash 'abc'", () => {
            const result = hashString("abc");
            const expected = new Uint8Array([
                0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
                0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
                0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
                0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
                0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
                0xd4, 0x00, 0x99, 0x23,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash 'hello world'", () => {
            const result = hashString("hello world");
            expect(result.length).toBe(64);
            const manualBytes = new TextEncoder().encode("hello world");
            expect(result).toEqual(hash(manualBytes));
        });
    });
    describe("custom output length", () => {
        it("should hash string with custom output length", () => {
            const result = hashString("test", 32);
            expect(result.length).toBe(32);
        });
        it("should hash with 1-byte output", () => {
            const result = hashString("abc", 1);
            expect(result.length).toBe(1);
        });
        it("should hash with 20-byte output", () => {
            const result = hashString("test", 20);
            expect(result.length).toBe(20);
        });
        it("should hash with 48-byte output", () => {
            const result = hashString("hello", 48);
            expect(result.length).toBe(48);
        });
        it("should hash with 64-byte output (explicit)", () => {
            const result = hashString("world", 64);
            expect(result.length).toBe(64);
        });
        it("should produce different hashes for different output lengths", () => {
            const str = "test";
            const hash20 = hashString(str, 20);
            const hash32 = hashString(str, 32);
            const hash64 = hashString(str, 64);
            expect(hash20).not.toEqual(hash32.slice(0, 20));
            expect(hash32).not.toEqual(hash64.slice(0, 32));
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
    describe("equivalence with hash()", () => {
        it("should match hash() with string input", () => {
            const str = "test string";
            const result1 = hashString(str);
            const result2 = hash(str);
            expect(result1).toEqual(result2);
        });
        it("should match hash() for various strings", () => {
            const strings = ["", "a", "abc", "hello", "test message"];
            for (const str of strings) {
                expect(hashString(str)).toEqual(hash(str));
            }
        });
        it("should match hash() with custom output length", () => {
            const str = "test";
            expect(hashString(str, 32)).toEqual(hash(str, 32));
            expect(hashString(str, 48)).toEqual(hash(str, 48));
        });
    });
    describe("determinism", () => {
        it("should be deterministic", () => {
            const str = "test string";
            const hash1 = hashString(str);
            const hash2 = hashString(str);
            expect(hash1).toEqual(hash2);
        });
        it("should be deterministic with custom output length", () => {
            const str = "hello";
            const hash1 = hashString(str, 32);
            const hash2 = hashString(str, 32);
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
    describe("validation", () => {
        it("should throw error for invalid output length (too small)", () => {
            expect(() => hashString("test", 0)).toThrow("Invalid output length: 0. Must be between 1 and 64 bytes.");
            expect(() => hashString("test", -1)).toThrow("Invalid output length: -1. Must be between 1 and 64 bytes.");
        });
        it("should throw error for invalid output length (too large)", () => {
            expect(() => hashString("test", 65)).toThrow("Invalid output length: 65. Must be between 1 and 64 bytes.");
            expect(() => hashString("test", 100)).toThrow("Invalid output length: 100. Must be between 1 and 64 bytes.");
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
    });
    describe("edge cases", () => {
        it("should hash very long string", () => {
            const longString = "a".repeat(10000);
            const result = hashString(longString);
            expect(result.length).toBe(64);
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
    });
    describe("cross-validation with @noble/hashes", () => {
        it("should match @noble for various strings", () => {
            const strings = [
                "",
                "a",
                "abc",
                "hello world",
                "The quick brown fox jumps over the lazy dog",
            ];
            for (const str of strings) {
                const result = hashString(str);
                const expected = blake2b(new TextEncoder().encode(str), { dkLen: 64 });
                expect(result).toEqual(expected);
            }
        });
        it("should match @noble with custom output lengths", () => {
            const str = "test";
            const lengths = [1, 20, 32, 48, 64];
            for (const len of lengths) {
                const result = hashString(str, len);
                const expected = blake2b(new TextEncoder().encode(str), { dkLen: len });
                expect(result).toEqual(expected);
            }
        });
        it("should match @noble for UTF-8 strings", () => {
            const strings = ["Hello 世界 🌍", "🚀🔥💯", "中文测试"];
            for (const str of strings) {
                const result = hashString(str);
                const expected = blake2b(new TextEncoder().encode(str), { dkLen: 64 });
                expect(result).toEqual(expected);
            }
        });
    });
    describe("common use cases", () => {
        it("should hash file path", () => {
            const result = hashString("/path/to/file.txt");
            expect(result.length).toBe(64);
        });
        it("should hash URL", () => {
            const result = hashString("https://example.com/path?query=value");
            expect(result.length).toBe(64);
        });
        it("should hash JSON", () => {
            const json = JSON.stringify({ key: "value", number: 42 });
            const result = hashString(json);
            expect(result.length).toBe(64);
        });
        it("should hash multiline text", () => {
            const text = `Line 1
Line 2
Line 3`;
            const result = hashString(text);
            expect(result.length).toBe(64);
        });
    });
});
