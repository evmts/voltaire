/**
 * SHA256.hash tests
 *
 * Tests for the hash function covering:
 * - Known SHA256 test vectors (NIST FIPS 180-4)
 * - Various input types and sizes
 * - Edge cases and boundary conditions
 * - Cross-validation against @noble/hashes
 */
import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
describe("SHA256 hash function", () => {
    describe("known test vectors", () => {
        it("should hash empty input (NIST vector)", () => {
            const result = hash(new Uint8Array([]));
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(32);
            const expected = new Uint8Array([
                0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8,
                0x99, 0x6f, 0xb9, 0x24, 0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
                0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash 'abc' (NIST vector)", () => {
            const input = new Uint8Array([0x61, 0x62, 0x63]);
            const result = hash(input);
            const expected = new Uint8Array([
                0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde,
                0x5d, 0xae, 0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
                0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash NIST vector: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'", () => {
            const input = new TextEncoder().encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
            const result = hash(input);
            const expected = new Uint8Array([
                0x24, 0x8d, 0x6a, 0x61, 0xd2, 0x06, 0x38, 0xb8, 0xe5, 0xc0, 0x26, 0x93,
                0x0c, 0x3e, 0x60, 0x39, 0xa3, 0x3c, 0xe4, 0x59, 0x64, 0xff, 0x21, 0x67,
                0xf6, 0xec, 0xed, 0xd4, 0x19, 0xdb, 0x06, 0xc1,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash single byte 0x00", () => {
            const input = new Uint8Array([0x00]);
            const result = hash(input);
            const expected = new Uint8Array([
                0x6e, 0x34, 0x0b, 0x9c, 0xff, 0xb3, 0x7a, 0x98, 0x9c, 0xa5, 0x44, 0xe6,
                0xbb, 0x78, 0x0a, 0x2c, 0x78, 0x90, 0x1d, 0x3f, 0xb3, 0x37, 0x38, 0x76,
                0x85, 0x11, 0xa3, 0x06, 0x17, 0xaf, 0xa0, 0x1d,
            ]);
            expect(result).toEqual(expected);
        });
        it("should hash single byte 0xFF", () => {
            const input = new Uint8Array([0xff]);
            const result = hash(input);
            expect(result).toEqual(sha256(input));
            expect(result.length).toBe(32);
        });
    });
    describe("determinism", () => {
        it("should produce identical results for identical inputs", () => {
            const input = new Uint8Array([1, 2, 3, 4, 5]);
            const hash1 = hash(input);
            const hash2 = hash(input);
            expect(hash1).toEqual(hash2);
        });
        it("should produce different hashes for different inputs", () => {
            const hash1 = hash(new Uint8Array([0x00]));
            const hash2 = hash(new Uint8Array([0x01]));
            const hash3 = hash(new Uint8Array([0x00, 0x00]));
            expect(hash1).not.toEqual(hash2);
            expect(hash1).not.toEqual(hash3);
            expect(hash2).not.toEqual(hash3);
        });
    });
    describe("input sizes", () => {
        it("should hash exactly 64 bytes (one block)", () => {
            const input = new Uint8Array(64).fill(0x42);
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should hash 65 bytes (just over one block)", () => {
            const input = new Uint8Array(65).fill(0x42);
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should hash boundary: 55 bytes", () => {
            const input = new Uint8Array(55).fill(0x61);
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should hash boundary: 56 bytes", () => {
            const input = new Uint8Array(56).fill(0x61);
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should hash large input (1MB)", () => {
            const input = new Uint8Array(1024 * 1024);
            for (let i = 0; i < input.length; i++) {
                input[i] = i & 0xff;
            }
            const result = hash(input);
            expect(result.length).toBe(32);
            const result2 = hash(input);
            expect(result).toEqual(result2);
        });
    });
    describe("edge cases", () => {
        it("should hash all-zero input", () => {
            const input = new Uint8Array(32).fill(0);
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should hash all-ones input", () => {
            const input = new Uint8Array(32).fill(0xff);
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should hash all byte values", () => {
            const input = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                input[i] = i;
            }
            const result = hash(input);
            expect(result.length).toBe(32);
            expect(result).toEqual(sha256(input));
        });
        it("should exhibit avalanche effect", () => {
            const input1 = new Uint8Array(100).fill(0);
            const input2 = new Uint8Array(100).fill(0);
            input2[99] = 1;
            const hash1 = hash(input1);
            const hash2 = hash(input2);
            expect(hash1).not.toEqual(hash2);
            let differentBytes = 0;
            for (let i = 0; i < hash1.length; i++) {
                if (hash1[i] !== hash2[i])
                    differentBytes++;
            }
            expect(differentBytes).toBeGreaterThanOrEqual(8);
        });
    });
    describe("cross-validation with @noble/hashes", () => {
        it("should match @noble for empty input", () => {
            const input = new Uint8Array([]);
            expect(hash(input)).toEqual(sha256(input));
        });
        it("should match @noble for various sizes", () => {
            const sizes = [1, 10, 32, 55, 56, 64, 65, 100, 128, 256, 512, 1024];
            for (const size of sizes) {
                const input = new Uint8Array(size);
                for (let i = 0; i < size; i++) {
                    input[i] = (i * 7) & 0xff;
                }
                expect(hash(input)).toEqual(sha256(input));
            }
        });
        it("should match @noble for random data", () => {
            const input = new Uint8Array(1000);
            for (let i = 0; i < input.length; i++) {
                input[i] = (i * 13 + 7) & 0xff;
            }
            expect(hash(input)).toEqual(sha256(input));
        });
    });
});
