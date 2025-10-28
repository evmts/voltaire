/**
 * SHA256 Test Suite
 *
 * Comprehensive tests including:
 * - NIST test vectors
 * - Empty input
 * - String inputs
 * - Large inputs
 * - Edge cases
 * - Incremental hashing
 */

import { describe, test, expect } from "vitest";
import { Sha256 } from "./sha256.js";

describe("Sha256", () => {
  describe("NIST test vectors", () => {
    test("empty string", () => {
      const hash = Sha256.hashString("");
      const expected = new Uint8Array([
        0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9,
        0x24, 0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c, 0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52,
        0xb8, 0x55,
      ]);
      expect(hash).toEqual(expected);
    });

    test("abc", () => {
      const hash = Sha256.hashString("abc");
      const expected = new Uint8Array([
        0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22,
        0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00,
        0x15, 0xad,
      ]);
      expect(hash).toEqual(expected);
    });

    test("hello world", () => {
      const hash = Sha256.hashString("hello world");
      const expected = new Uint8Array([
        0xb9, 0x4d, 0x27, 0xb9, 0x93, 0x4d, 0x3e, 0x08, 0xa5, 0x2e, 0x52, 0xd7, 0xda, 0x7d, 0xab,
        0xfa, 0xc4, 0x84, 0xef, 0xe3, 0x7a, 0x53, 0x80, 0xee, 0x90, 0x88, 0xf7, 0xac, 0xe2, 0xef,
        0xcd, 0xe9,
      ]);
      expect(hash).toEqual(expected);
    });

    test("448-bit message", () => {
      const hash = Sha256.hashString("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
      const expected = new Uint8Array([
        0x24, 0x8d, 0x6a, 0x61, 0xd2, 0x06, 0x38, 0xb8, 0xe5, 0xc0, 0x26, 0x93, 0x0c, 0x3e, 0x60,
        0x39, 0xa3, 0x3c, 0xe4, 0x59, 0x64, 0xff, 0x21, 0x67, 0xf6, 0xec, 0xed, 0xd4, 0x19, 0xdb,
        0x06, 0xc1,
      ]);
      expect(hash).toEqual(expected);
    });

    test("896-bit message", () => {
      const hash = Sha256.hashString(
        "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
      );
      const expected = new Uint8Array([
        0xcf, 0x5b, 0x16, 0xa7, 0x78, 0xaf, 0x83, 0x80, 0x03, 0x6c, 0xe5, 0x9e, 0x7b, 0x04, 0x92,
        0x37, 0x0b, 0x24, 0x9b, 0x11, 0xe8, 0xf0, 0x7a, 0x51, 0xaf, 0xac, 0x45, 0x03, 0x7a, 0xfe,
        0xe9, 0xd1,
      ]);
      expect(hash).toEqual(expected);
    });

    test("quick brown fox", () => {
      const hash = Sha256.hashString("The quick brown fox jumps over the lazy dog");
      const expected = new Uint8Array([
        0xd7, 0xa8, 0xfb, 0xb3, 0x07, 0xd7, 0x80, 0x94, 0x69, 0xca, 0x9a, 0xbc, 0xb0, 0x08, 0x2e,
        0x4f, 0x8d, 0x56, 0x51, 0xe4, 0x6d, 0x3c, 0xdb, 0x76, 0x2d, 0x02, 0xd0, 0xbf, 0x37, 0xc9,
        0xe5, 0x92,
      ]);
      expect(hash).toEqual(expected);
    });

    test("quick brown fox (with period)", () => {
      const hash = Sha256.hashString("The quick brown fox jumps over the lazy dog.");
      const expected = new Uint8Array([
        0xef, 0x53, 0x7f, 0x25, 0xc8, 0x95, 0xbf, 0xa7, 0x82, 0x52, 0x65, 0x29, 0xa9, 0xb6, 0x3d,
        0x97, 0xaa, 0x63, 0x15, 0x64, 0xd5, 0xd7, 0x89, 0xc2, 0xb7, 0x65, 0x44, 0x8c, 0x86, 0x35,
        0xfb, 0x6c,
      ]);
      expect(hash).toEqual(expected);
    });
  });

  describe("hash (Uint8Array)", () => {
    test("empty bytes", () => {
      const hash = Sha256.hash(new Uint8Array([]));
      const expected = new Uint8Array([
        0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9,
        0x24, 0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c, 0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52,
        0xb8, 0x55,
      ]);
      expect(hash).toEqual(expected);
    });

    test("single byte", () => {
      const hash = Sha256.hash(new Uint8Array([0x00]));
      const expected = new Uint8Array([
        0x6e, 0x34, 0x0b, 0x9c, 0xff, 0xb3, 0x7a, 0x98, 0x9c, 0xa5, 0x44, 0xe6, 0xbb, 0x78, 0x0a,
        0x2c, 0x78, 0x90, 0x1d, 0x3f, 0xb3, 0x37, 0x38, 0x76, 0x85, 0x11, 0xa3, 0x06, 0x17, 0xaf,
        0xa0, 0x1d,
      ]);
      expect(hash).toEqual(expected);
    });

    test("all zeros (32 bytes)", () => {
      const hash = Sha256.hash(new Uint8Array(32));
      const expected = new Uint8Array([
        0x66, 0x68, 0x7a, 0xad, 0xf8, 0x62, 0xbd, 0x77, 0x6c, 0x8f, 0xc1, 0x8b, 0x8e, 0x9f, 0x8e,
        0x20, 0x08, 0x97, 0x14, 0x85, 0x6e, 0xe2, 0x33, 0xb3, 0x90, 0x2a, 0x59, 0x1d, 0x0d, 0x5f,
        0x29, 0x25,
      ]);
      expect(hash).toEqual(expected);
    });

    test("all 0xff (32 bytes)", () => {
      const hash = Sha256.hash(new Uint8Array(32).fill(0xff));
      const expected = new Uint8Array([
        0xaf, 0x96, 0x13, 0x76, 0x0f, 0x72, 0x63, 0x5f, 0xbd, 0xb4, 0x4a, 0x5a, 0x0a, 0x63, 0xc3,
        0x9f, 0x12, 0xaf, 0x30, 0xf9, 0x50, 0xa6, 0xee, 0x5c, 0x97, 0x1b, 0xe1, 0x88, 0xe8, 0x9c,
        0x40, 0x51,
      ]);
      expect(hash).toEqual(expected);
    });
  });

  describe("edge cases", () => {
    test("one block boundary (55 bytes)", () => {
      const data = new Uint8Array(55).fill(0xab);
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });

    test("one block boundary (56 bytes)", () => {
      const data = new Uint8Array(56).fill(0xab);
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });

    test("exactly one block (64 bytes)", () => {
      const data = new Uint8Array(64).fill(0xab);
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });

    test("one byte over block (65 bytes)", () => {
      const data = new Uint8Array(65).fill(0xab);
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });

    test("two blocks (128 bytes)", () => {
      const data = new Uint8Array(128).fill(0xab);
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });

    test("large input (1KB)", () => {
      const data = new Uint8Array(1024).fill(0xab);
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });

    test("very large input (1MB)", () => {
      const data = new Uint8Array(1024 * 1024);
      for (let i = 0; i < data.length; i++) {
        data[i] = i & 0xff;
      }
      const hash = Sha256.hash(data);
      expect(hash.length).toBe(32);
    });
  });

  describe("hashHex", () => {
    test("hex with 0x prefix", () => {
      const hash = Sha256.hashHex("0xdeadbeef");
      expect(hash.length).toBe(32);
    });

    test("hex without 0x prefix", () => {
      const hash = Sha256.hashHex("deadbeef");
      expect(hash.length).toBe(32);
    });

    test("empty hex", () => {
      const hash1 = Sha256.hashHex("0x");
      const hash2 = Sha256.hash(new Uint8Array([]));
      expect(hash1).toEqual(hash2);
    });
  });

  describe("toHex", () => {
    test("converts hash to hex string", () => {
      const hash = Sha256.hashString("hello");
      const hex = Sha256.toHex(hash);
      expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
      expect(hex).toBe("0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });

    test("converts all zeros", () => {
      const hash = new Uint8Array(32);
      const hex = Sha256.toHex(hash);
      expect(hex).toBe(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    });

    test("converts all 0xff", () => {
      const hash = new Uint8Array(32).fill(0xff);
      const hex = Sha256.toHex(hash);
      expect(hex).toBe(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );
    });
  });

  describe("incremental hashing", () => {
    test("create and update", () => {
      const hasher = Sha256.create();
      hasher.update(new Uint8Array([0x61, 0x62, 0x63])); // "abc"
      const hash = hasher.digest();

      const expected = Sha256.hashString("abc");
      expect(hash).toEqual(expected);
    });

    test("multiple updates", () => {
      const hasher = Sha256.create();
      hasher.update(new Uint8Array([0x61])); // "a"
      hasher.update(new Uint8Array([0x62])); // "b"
      hasher.update(new Uint8Array([0x63])); // "c"
      const hash = hasher.digest();

      const expected = Sha256.hashString("abc");
      expect(hash).toEqual(expected);
    });

    test("update with empty data", () => {
      const hasher = Sha256.create();
      hasher.update(new Uint8Array([]));
      const hash = hasher.digest();

      const expected = Sha256.hashString("");
      expect(hash).toEqual(expected);
    });

    test("large data in chunks", () => {
      const hasher = Sha256.create();
      const chunkSize = 256;
      const chunks = 100;

      const fullData = new Uint8Array(chunkSize * chunks);
      for (let i = 0; i < fullData.length; i++) {
        fullData[i] = i & 0xff;
      }

      for (let i = 0; i < chunks; i++) {
        const chunk = fullData.slice(i * chunkSize, (i + 1) * chunkSize);
        hasher.update(chunk);
      }
      const incrementalHash = hasher.digest();

      const directHash = Sha256.hash(fullData);
      expect(incrementalHash).toEqual(directHash);
    });
  });

  describe("constants", () => {
    test("OUTPUT_SIZE is 32", () => {
      expect(Sha256.OUTPUT_SIZE).toBe(32);
    });

    test("BLOCK_SIZE is 64", () => {
      expect(Sha256.BLOCK_SIZE).toBe(64);
    });
  });

  describe("consistency", () => {
    test("hash and hashString produce same result for ASCII", () => {
      const str = "hello";
      const bytes = new TextEncoder().encode(str);

      const hash1 = Sha256.hash(bytes);
      const hash2 = Sha256.hashString(str);

      expect(hash1).toEqual(hash2);
    });

    test("hash and hashHex produce same result", () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const hex = "deadbeef";

      const hash1 = Sha256.hash(bytes);
      const hash2 = Sha256.hashHex(hex);

      expect(hash1).toEqual(hash2);
    });
  });
});
