import { describe, test, expect } from "bun:test";
import { isHex, hexToBytes, bytesToHex, hexToU256, u256ToHex } from "./hex.ts";

describe("hex validation", () => {
  test("isHex - valid hex strings", () => {
    expect(isHex("0x0")).toBe(true);
    expect(isHex("0x00")).toBe(true);
    expect(isHex("0x1234")).toBe(true);
    expect(isHex("0xabcdef")).toBe(true);
    expect(isHex("0xABCDEF")).toBe(true);
    expect(isHex("0x0123456789abcdef")).toBe(true);
    expect(isHex("0xdeadbeef")).toBe(true);
  });

  test("isHex - invalid hex strings", () => {
    expect(isHex("")).toBe(false);
    expect(isHex("0x")).toBe(false); // Too short
    expect(isHex("0")).toBe(false);
    expect(isHex("00")).toBe(false);
    expect(isHex("1234")).toBe(false); // Missing 0x
    expect(isHex("0xg")).toBe(false); // Invalid character
    expect(isHex("0xGHI")).toBe(false);
    expect(isHex("0x ")).toBe(false); // Space
    expect(isHex(" 0x00")).toBe(false); // Leading space
    expect(isHex("0x00 ")).toBe(false); // Trailing space
  });
});

describe("hex to bytes conversion", () => {
  test("hexToBytes - basic conversion", () => {
    const result = hexToBytes("0x1234");
    expect(result).toEqual(new Uint8Array([0x12, 0x34]));
  });

  test("hexToBytes - empty hex", () => {
    const result = hexToBytes("0x");
    expect(result).toEqual(new Uint8Array([]));
  });

  test("hexToBytes - single byte", () => {
    const result = hexToBytes("0x61");
    expect(result).toEqual(new Uint8Array([0x61]));
  });

  test("hexToBytes - multiple bytes", () => {
    const result = hexToBytes("0x616263");
    expect(result).toEqual(new Uint8Array([0x61, 0x62, 0x63]));
  });

  test("hexToBytes - mixed case", () => {
    const result = hexToBytes("0xDeAdBeEf");
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  test("hexToBytes - Hello World", () => {
    const result = hexToBytes("0x48656c6c6f20576f726c6421");
    const expected = new TextEncoder().encode("Hello World!");
    expect(result).toEqual(expected);
  });

  test("hexToBytes - errors on odd length", () => {
    expect(() => hexToBytes("0x1")).toThrow();
    expect(() => hexToBytes("0x123")).toThrow();
  });

  test("hexToBytes - errors on missing 0x", () => {
    expect(() => hexToBytes("deadbeef")).toThrow();
  });

  test("hexToBytes - errors on invalid character", () => {
    expect(() => hexToBytes("0xdeadbeeg")).toThrow();
  });
});

describe("bytes to hex conversion", () => {
  test("bytesToHex - basic conversion", () => {
    const bytes = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
    expect(bytesToHex(bytes)).toBe("0x1234abcd");
  });

  test("bytesToHex - empty bytes", () => {
    const bytes = new Uint8Array([]);
    expect(bytesToHex(bytes)).toBe("0x");
  });

  test("bytesToHex - single byte", () => {
    const bytes = new Uint8Array([0x61]);
    expect(bytesToHex(bytes)).toBe("0x61");
  });

  test("bytesToHex - multiple bytes", () => {
    const bytes = new Uint8Array([0x61, 0x62, 0x63]);
    expect(bytesToHex(bytes)).toBe("0x616263");
  });

  test("bytesToHex - lowercase output", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(bytesToHex(bytes)).toBe("0xdeadbeef");
  });

  test("bytesToHex - Hello World", () => {
    const bytes = new TextEncoder().encode("Hello World!");
    expect(bytesToHex(bytes)).toBe("0x48656c6c6f20576f726c6421");
  });
});

describe("round-trip conversions", () => {
  test("hex -> bytes -> hex", () => {
    const original = "0xdeadbeef";
    const bytes = hexToBytes(original);
    const result = bytesToHex(bytes);
    expect(result).toBe(original);
  });

  test("bytes -> hex -> bytes", () => {
    const original = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
    const hex = bytesToHex(original);
    const result = hexToBytes(hex);
    expect(result).toEqual(original);
  });
});

describe("numeric conversions - hexToU256", () => {
  test("hexToU256 - zero", () => {
    expect(hexToU256("0x0")).toBe(0n);
  });

  test("hexToU256 - small number", () => {
    expect(hexToU256("0x10f2c")).toBe(69420n);
  });

  test("hexToU256 - large number", () => {
    expect(hexToU256("0xdeadbeef")).toBe(0xdeadbeefn);
  });

  test("hexToU256 - 32 bytes (max u256)", () => {
    const max = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(hexToU256(max)).toBe(BigInt("0x" + "f".repeat(64)));
  });

  test("hexToU256 - 1 ether in wei", () => {
    expect(hexToU256("0xde0b6b3a7640000")).toBe(1000000000000000000n);
  });

  test("hexToU256 - errors on missing 0x", () => {
    expect(() => hexToU256("deadbeef")).toThrow();
  });

  test("hexToU256 - errors on invalid character", () => {
    expect(() => hexToU256("0xdeadbeeg")).toThrow();
  });
});

describe("numeric conversions - u256ToHex", () => {
  test("u256ToHex - zero", () => {
    expect(u256ToHex(0n)).toBe("0x0");
  });

  test("u256ToHex - small number", () => {
    expect(u256ToHex(69420n)).toBe("0x10f2c");
  });

  test("u256ToHex - large number", () => {
    expect(u256ToHex(0xdeadbeefn)).toBe("0xdeadbeef");
  });

  test("u256ToHex - max u256", () => {
    const max = BigInt("0x" + "f".repeat(64));
    expect(u256ToHex(max)).toBe("0x" + "f".repeat(64));
  });

  test("u256ToHex - 1 ether in wei", () => {
    expect(u256ToHex(1000000000000000000n)).toBe("0xde0b6b3a7640000");
  });

  test("u256ToHex - errors on negative", () => {
    expect(() => u256ToHex(-1n)).toThrow();
  });

  test("u256ToHex - errors on value > u256", () => {
    const tooLarge = BigInt("0x1" + "0".repeat(65)); // 2^256
    expect(() => u256ToHex(tooLarge)).toThrow();
  });
});

describe("numeric round-trip", () => {
  test("u256 -> hex -> u256", () => {
    const original = 123456789n;
    const hex = u256ToHex(original);
    const result = hexToU256(hex);
    expect(result).toBe(original);
  });

  test("hex -> u256 -> hex", () => {
    const original = "0xdeadbeef";
    const value = hexToU256(original);
    const result = u256ToHex(value);
    expect(result).toBe(original);
  });
});

describe("edge cases", () => {
  test("hexToBytes with uppercase and lowercase mixed", () => {
    const result = hexToBytes("0xAbCdEf");
    expect(result).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
  });

  test("bytesToHex produces lowercase", () => {
    const bytes = new Uint8Array([0xAB, 0xCD, 0xEF]);
    expect(bytesToHex(bytes)).toBe("0xabcdef");
  });

  test("large byte arrays", () => {
    const size = 1024;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = i % 256;
    }
    const hex = bytesToHex(bytes);
    const result = hexToBytes(hex);
    expect(result).toEqual(bytes);
  });
});
