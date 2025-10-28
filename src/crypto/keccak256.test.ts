/**
 * Keccak256 Tests
 *
 * Comprehensive tests for Keccak256 implementation including:
 * - Known test vectors
 * - Different input types (Uint8Array, string, hex)
 * - Edge cases (empty input, large input, unicode)
 * - Ethereum-specific utilities (selectors, topics, addresses)
 */

import { describe, expect, test } from "bun:test";
import { Keccak256 } from "./keccak256.js";
import { Hash } from "../primitives/hash.js";

// ============================================================================
// Test Vectors
// ============================================================================

describe("Keccak256 - Known Test Vectors", () => {
  test("empty string", () => {
    const result = Keccak256.hashString("");
    const expected = Hash.fromHex(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("abc", () => {
    const result = Keccak256.hashString("abc");
    const expected = Hash.fromHex(
      "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("hello", () => {
    const result = Keccak256.hashString("hello");
    const expected = Hash.fromHex(
      "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("The quick brown fox jumps over the lazy dog", () => {
    const result = Keccak256.hashString("The quick brown fox jumps over the lazy dog");
    const expected = Hash.fromHex(
      "0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("zero byte", () => {
    const result = Keccak256.hash(new Uint8Array([0x00]));
    const expected = Hash.fromHex(
      "0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("0xff byte", () => {
    const result = Keccak256.hash(new Uint8Array([0xff]));
    const expected = Hash.fromHex(
      "0x37ffe1b257da0e9e635c2daa5e92b5e43b44ba5c6c4f8b08db3d67af43c38ca1",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });
});

// ============================================================================
// Input Types
// ============================================================================

describe("Keccak256 - Input Types", () => {
  test("hash - Uint8Array input", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = Keccak256.hash(data);
    expect(Hash.isHash(result)).toBe(true);
    expect(result.length).toBe(32);
  });

  test("hashString - UTF-8 encoding", () => {
    const result = Keccak256.hashString("test");
    expect(Hash.isHash(result)).toBe(true);
    expect(result.length).toBe(32);
  });

  test("hashHex - with 0x prefix", () => {
    const result = Keccak256.hashHex("0x1234");
    const expected = Keccak256.hash(new Uint8Array([0x12, 0x34]));
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("hashHex - without prefix", () => {
    const result = Keccak256.hashHex("1234");
    const expected = Keccak256.hash(new Uint8Array([0x12, 0x34]));
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("hashHex - throws on odd length", () => {
    expect(() => Keccak256.hashHex("0x123")).toThrow("even length");
  });

  test("hashHex - throws on invalid chars", () => {
    expect(() => Keccak256.hashHex("0xzzz")).toThrow("Invalid hex");
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Keccak256 - Edge Cases", () => {
  test("empty data", () => {
    const result = Keccak256.hash(new Uint8Array(0));
    const expected = Hash.fromHex(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("single byte", () => {
    const result = Keccak256.hash(new Uint8Array([0x42]));
    expect(Hash.isHash(result)).toBe(true);
  });

  test("exactly at rate boundary (136 bytes)", () => {
    const data = new Uint8Array(136);
    data.fill(0x61); // 'a'
    const result = Keccak256.hash(data);
    expect(Hash.isHash(result)).toBe(true);
  });

  test("one byte over rate boundary", () => {
    const data = new Uint8Array(137);
    data.fill(0x61);
    const result = Keccak256.hash(data);
    expect(Hash.isHash(result)).toBe(true);
  });

  test("one byte under rate boundary", () => {
    const data = new Uint8Array(135);
    data.fill(0x61);
    const result = Keccak256.hash(data);
    expect(Hash.isHash(result)).toBe(true);
  });

  test("large input (1MB)", () => {
    const data = new Uint8Array(1024 * 1024);
    for (let i = 0; i < data.length; i++) {
      data[i] = i & 0xff;
    }
    const result = Keccak256.hash(data);
    expect(Hash.isHash(result)).toBe(true);
  });

  test("unicode string", () => {
    const result = Keccak256.hashString("Hello 世界 🌍");
    expect(Hash.isHash(result)).toBe(true);
  });

  test("string with newlines", () => {
    const result = Keccak256.hashString("line1\nline2\nline3");
    expect(Hash.isHash(result)).toBe(true);
  });

  test("string with null bytes", () => {
    const result = Keccak256.hashString("test\x00data");
    expect(Hash.isHash(result)).toBe(true);
  });
});

// ============================================================================
// Multiple Chunks
// ============================================================================

describe("Keccak256 - Multiple Chunks", () => {
  test("hashMultiple - equivalent to concatenation", () => {
    const chunk1 = new Uint8Array([1, 2, 3]);
    const chunk2 = new Uint8Array([4, 5, 6]);
    const chunk3 = new Uint8Array([7, 8, 9]);

    const resultMultiple = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);
    const resultSingle = Keccak256.hash(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));

    expect(Hash.equals.call(resultMultiple, resultSingle)).toBe(true);
  });

  test("hashMultiple - empty array", () => {
    const result = Keccak256.hashMultiple([]);
    const expected = Keccak256.hash(new Uint8Array(0));
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("hashMultiple - single chunk", () => {
    const chunk = new Uint8Array([1, 2, 3]);
    const resultMultiple = Keccak256.hashMultiple([chunk]);
    const resultSingle = Keccak256.hash(chunk);
    expect(Hash.equals.call(resultMultiple, resultSingle)).toBe(true);
  });
});

// ============================================================================
// Ethereum Utilities
// ============================================================================

describe("Keccak256 - Ethereum Utilities", () => {
  test("selector - transfer function", () => {
    const result = Keccak256.selector("transfer(address,uint256)");
    expect(result.length).toBe(4);
    expect(result[0]).toBe(0xa9);
    expect(result[1]).toBe(0x05);
    expect(result[2]).toBe(0x9c);
    expect(result[3]).toBe(0xbb);
  });

  test("selector - balanceOf function", () => {
    const result = Keccak256.selector("balanceOf(address)");
    expect(result.length).toBe(4);
    expect(result[0]).toBe(0x70);
    expect(result[1]).toBe(0xa0);
    expect(result[2]).toBe(0x82);
    expect(result[3]).toBe(0x31);
  });

  test("topic - Transfer event", () => {
    const result = Keccak256.topic("Transfer(address,address,uint256)");
    const expected = Hash.fromHex(
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("topic - Approval event", () => {
    const result = Keccak256.topic("Approval(address,address,uint256)");
    const expected = Hash.fromHex(
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    );
    expect(Hash.equals.call(result, expected)).toBe(true);
  });

  test("contractAddress - basic", () => {
    const sender = new Uint8Array(20);
    sender.fill(0x42);
    const result = Keccak256.contractAddress(sender, 0n);
    expect(result.length).toBe(20);
  });

  test("contractAddress - throws on invalid sender", () => {
    const sender = new Uint8Array(19);
    expect(() => Keccak256.contractAddress(sender, 0n)).toThrow("20 bytes");
  });

  test("create2Address - basic", () => {
    const sender = new Uint8Array(20);
    sender.fill(0x11);
    const salt = new Uint8Array(32);
    salt.fill(0x22);
    const initCodeHash = new Uint8Array(32);
    initCodeHash.fill(0x33);

    const result = Keccak256.create2Address(sender, salt, initCodeHash);
    expect(result.length).toBe(20);
  });

  test("create2Address - throws on invalid sender", () => {
    const sender = new Uint8Array(19);
    const salt = new Uint8Array(32);
    const initCodeHash = new Uint8Array(32);
    expect(() => Keccak256.create2Address(sender, salt, initCodeHash)).toThrow(
      "20 bytes",
    );
  });

  test("create2Address - throws on invalid salt", () => {
    const sender = new Uint8Array(20);
    const salt = new Uint8Array(31);
    const initCodeHash = new Uint8Array(32);
    expect(() => Keccak256.create2Address(sender, salt, initCodeHash)).toThrow(
      "32 bytes",
    );
  });

  test("create2Address - throws on invalid init code hash", () => {
    const sender = new Uint8Array(20);
    const salt = new Uint8Array(32);
    const initCodeHash = new Uint8Array(31);
    expect(() => Keccak256.create2Address(sender, salt, initCodeHash)).toThrow(
      "32 bytes",
    );
  });
});

// ============================================================================
// Consistency
// ============================================================================

describe("Keccak256 - Consistency", () => {
  test("same input produces same output", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result1 = Keccak256.hash(data);
    const result2 = Keccak256.hash(data);
    expect(Hash.equals.call(result1, result2)).toBe(true);
  });

  test("different inputs produce different outputs", () => {
    const data1 = new Uint8Array([1, 2, 3]);
    const data2 = new Uint8Array([1, 2, 4]);
    const result1 = Keccak256.hash(data1);
    const result2 = Keccak256.hash(data2);
    expect(Hash.equals.call(result1, result2)).toBe(false);
  });

  test("modifying input does not affect result", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = Keccak256.hash(data);
    data[0] = 99;
    const result2 = Keccak256.hash(new Uint8Array([1, 2, 3, 4, 5]));
    expect(Hash.equals.call(result, result2)).toBe(true);
  });
});

// ============================================================================
// Constants
// ============================================================================

describe("Keccak256 - Constants", () => {
  test("DIGEST_SIZE is 32", () => {
    expect(Keccak256.DIGEST_SIZE).toBe(32);
  });

  test("RATE is 136", () => {
    expect(Keccak256.RATE).toBe(136);
  });

  test("STATE_SIZE is 25", () => {
    expect(Keccak256.STATE_SIZE).toBe(25);
  });
});
