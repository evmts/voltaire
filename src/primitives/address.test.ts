import { describe, test, expect } from "bun:test";
import {
  Address,
  ZERO_ADDRESS,
  validateChecksum,
  calculateCreateAddress,
  calculateCreate2Address,
} from "./address.ts";

describe("Address creation", () => {
  test("fromHex - valid address", () => {
    const addr = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    expect(addr.bytes.length).toBe(20);
  });

  test("fromHex - with 0x prefix", () => {
    const addr = Address.fromHex(
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    );
    expect(addr.toHex()).toBe("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  });

  test("fromHex - mixed case", () => {
    const addr = Address.fromHex(
      "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
    );
    expect(addr.toHex()).toBe("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
  });

  test("fromHex - rejects invalid length", () => {
    expect(() => Address.fromHex("0x123")).toThrow();
    expect(() => Address.fromHex("0x" + "00".repeat(21))).toThrow();
  });

  test("fromHex - rejects invalid characters", () => {
    expect(() => Address.fromHex("0x" + "zz".repeat(20))).toThrow();
  });

  test("fromHex - rejects missing 0x", () => {
    expect(() => Address.fromHex("a0cf798816d4b9b9866b5330eea46a18382f251e")).toThrow();
  });
});

describe("Address conversion", () => {
  test("toHex - lowercase output", () => {
    const addr = Address.fromHex(
      "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
    );
    expect(addr.toHex()).toBe("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
  });

  test("toChecksumHex - EIP-55 checksum", () => {
    const testCases = [
      {
        input: "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
        expected: "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
      },
      {
        input: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        expected: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
      {
        input: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        expected: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
    ];

    for (const { input, expected } of testCases) {
      const addr = Address.fromHex(input);
      expect(addr.toChecksumHex()).toBe(expected);
    }
  });
});

describe("Address validation", () => {
  test("validateChecksum - valid checksums", () => {
    expect(
      validateChecksum("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")
    ).toBe(true);
    expect(
      validateChecksum("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    ).toBe(true);
    expect(
      validateChecksum("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
    ).toBe(true);
  });

  test("validateChecksum - invalid checksums", () => {
    expect(
      validateChecksum("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
    ).toBe(false);
    expect(
      validateChecksum("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")
    ).toBe(false);
  });
});

describe("Address equality", () => {
  test("equals - same address", () => {
    const addr1 = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const addr2 = Address.fromHex(
      "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
    );
    expect(addr1.equals(addr2)).toBe(true);
  });

  test("equals - different address", () => {
    const addr1 = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const addr2 = Address.fromHex(
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    );
    expect(addr1.equals(addr2)).toBe(false);
  });

  test("isZero - zero address", () => {
    const zero = Address.fromHex("0x" + "00".repeat(20));
    expect(zero.isZero()).toBe(true);
    expect(ZERO_ADDRESS.isZero()).toBe(true);
  });

  test("isZero - non-zero address", () => {
    const addr = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    expect(addr.isZero()).toBe(false);
  });
});

describe("Address from public key", () => {
  test("fromPublicKey - derives correct address", () => {
    // Test vector from Ethereum: Anvil account #0
    const pubKeyX =
      0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75n;
    const pubKeyY =
      0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5n;

    const addr = Address.fromPublicKey(pubKeyX, pubKeyY);
    expect(addr.toChecksumHex()).toBe(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    );
  });
});

describe("Address numeric conversion", () => {
  test("toU256 and fromU256 - round trip", () => {
    const addr = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const u256 = addr.toU256();
    const result = Address.fromU256(u256);
    expect(result.equals(addr)).toBe(true);
  });

  test("fromU256 - uses last 20 bytes", () => {
    const value = 0xffffffffffffffffffffffffffffffffffffffffn;
    const addr = Address.fromU256(value);
    expect(addr.toHex()).toBe("0x" + "ff".repeat(20));
  });
});

describe("CREATE address calculation", () => {
  test("calculateCreateAddress - nonce 0", () => {
    const deployer = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const addr = calculateCreateAddress(deployer, 0n);
    expect(addr.toHex()).toBe("0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d");
  });

  test("calculateCreateAddress - nonce 1", () => {
    const deployer = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const addr = calculateCreateAddress(deployer, 1n);
    expect(addr.toHex()).toBe("0x343c43a37d37dff08ae8c4a11544c718abb4fcf8");
  });

  test("calculateCreateAddress - various nonces", () => {
    const deployer = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );

    const testCases = [
      { nonce: 0n, expected: "0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d" },
      { nonce: 1n, expected: "0x343c43a37d37dff08ae8c4a11544c718abb4fcf8" },
      { nonce: 2n, expected: "0xf778b86fa74e846c4f0a1fbd1335fe81c00a0c91" },
      { nonce: 3n, expected: "0xfffd933a0bc612844eaf0c6fe3e5b8e9b6c1d19c" },
    ];

    for (const { nonce, expected } of testCases) {
      const addr = calculateCreateAddress(deployer, nonce);
      expect(addr.toHex()).toBe(expected);
    }
  });

  test("calculateCreateAddress - deterministic", () => {
    const deployer = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const addr1 = calculateCreateAddress(deployer, 42n);
    const addr2 = calculateCreateAddress(deployer, 42n);
    expect(addr1.equals(addr2)).toBe(true);
  });
});

describe("CREATE2 address calculation", () => {
  test("calculateCreate2Address - zero values", () => {
    const deployer = Address.fromHex("0x" + "00".repeat(20));
    const salt = new Uint8Array(32);
    const initCodeHash = new Uint8Array(32);

    const addr = calculateCreate2Address(deployer, salt, initCodeHash);
    expect(addr.toHex()).toBe("0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38");
  });

  test("calculateCreate2Address - deterministic", () => {
    const deployer = Address.fromHex(
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
    );
    const salt = new Uint8Array(32);
    salt[0] = 0x12;
    salt[1] = 0x34;
    salt[2] = 0x56;
    salt[3] = 0x78;

    const initCodeHash = new Uint8Array(32);
    initCodeHash[0] = 0xab;
    initCodeHash[1] = 0xcd;
    initCodeHash[2] = 0xef;

    const addr1 = calculateCreate2Address(deployer, salt, initCodeHash);
    const addr2 = calculateCreate2Address(deployer, salt, initCodeHash);
    expect(addr1.equals(addr2)).toBe(true);
  });

  test("calculateCreate2Address - different with different deployer", () => {
    const deployer1 = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const deployer2 = Address.fromHex(
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    );
    const salt = new Uint8Array(32);
    const initCodeHash = new Uint8Array(32);

    const addr1 = calculateCreate2Address(deployer1, salt, initCodeHash);
    const addr2 = calculateCreate2Address(deployer2, salt, initCodeHash);
    expect(addr1.equals(addr2)).toBe(false);
  });

  test("calculateCreate2Address - different with different salt", () => {
    const deployer = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const salt1 = new Uint8Array(32);
    salt1[0] = 0x01;
    const salt2 = new Uint8Array(32);
    salt2[0] = 0x02;
    const initCodeHash = new Uint8Array(32);

    const addr1 = calculateCreate2Address(deployer, salt1, initCodeHash);
    const addr2 = calculateCreate2Address(deployer, salt2, initCodeHash);
    expect(addr1.equals(addr2)).toBe(false);
  });

  test("calculateCreate2Address - different with different initCodeHash", () => {
    const deployer = Address.fromHex(
      "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
    );
    const salt = new Uint8Array(32);
    const initCodeHash1 = new Uint8Array(32);
    initCodeHash1[0] = 0x01;
    const initCodeHash2 = new Uint8Array(32);
    initCodeHash2[0] = 0x02;

    const addr1 = calculateCreate2Address(deployer, salt, initCodeHash1);
    const addr2 = calculateCreate2Address(deployer, salt, initCodeHash2);
    expect(addr1.equals(addr2)).toBe(false);
  });
});

describe("Edge cases", () => {
  test("Address - all zeros", () => {
    const zero = Address.fromHex("0x" + "00".repeat(20));
    expect(zero.isZero()).toBe(true);
    expect(zero.toHex()).toBe("0x" + "00".repeat(20));
  });

  test("Address - all ones", () => {
    const ones = Address.fromHex("0x" + "ff".repeat(20));
    expect(ones.isZero()).toBe(false);
    expect(ones.toHex()).toBe("0x" + "ff".repeat(20));
  });
});
