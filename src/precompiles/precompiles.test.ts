import { describe, it, expect } from "vitest";
import {
  ecrecover as evmEcrecover,
  modexp as evmModexp,
  bn254Add as evmBn254Add,
  bn254Mul as evmBn254Mul,
  bn254Pairing as evmBn254Pairing,
  identity as evmIdentity,
  sha256 as evmSha256,
  ripemd160 as evmRipemd160,
} from "./precompiles.js";
import { Secp256k1 } from "../crypto/secp256k1.js";
import { Keccak256 } from "../crypto/keccak256.js";

function beBytes32(n: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = n;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

describe("Precompiles - core behaviors", () => {
  it("ecrecover recovers correct address", () => {
    // Message hash (keccak256 of a test string)
    const msg = new TextEncoder().encode("hello evm ecrecover");
    const msgHash = Keccak256.hash(msg);

    // Deterministic private key for test (not secure)
    const priv = new Uint8Array(32);
    priv[31] = 7; // small scalar

    const sig = Secp256k1.sign(msgHash, priv);
    const pub = Secp256k1.derivePublicKey(priv);
    const addr = Keccak256.hash(pub).slice(12); // last 20 bytes

    // Build EVM ecrecover input: hash(32) | v(32) | r(32) | s(32)
    const input = new Uint8Array(128);
    input.set(msgHash, 0);
    const vBytes = beBytes32(BigInt(sig.v));
    input.set(vBytes, 32);
    input.set(sig.r, 64);
    input.set(sig.s, 96);

    const res = evmEcrecover(input, 3000n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(32);
    // Left 12 bytes zero, last 20 = address
    expect([...res.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
    expect(Buffer.from(res.output.slice(12)).equals(Buffer.from(addr))).toBe(
      true,
    );
  });

  it("sha256 hashes input correctly", () => {
    const data = new TextEncoder().encode("abc");
    const res = evmSha256(data, 10000n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(32);
    // Known SHA-256 of "abc"
    const expected =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    expect(Buffer.from(res.output).toString("hex")).toBe(expected);
  });

  it("ripemd160 hashes and left-pads to 32 bytes", () => {
    const data = new TextEncoder().encode("abc");
    const res = evmRipemd160(data, 100000n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(32);
    // Left pad zeros
    expect([...res.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
    // Known RIPEMD-160 of "abc": 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
    const expectedTail = "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc";
    expect(Buffer.from(res.output.slice(12)).toString("hex")).toBe(
      expectedTail,
    );
  });

  it("identity returns input bytes", () => {
    const input = new Uint8Array([1, 2, 3, 4, 5]);
    const res = evmIdentity(input, 1000n);
    expect(res.success).toBe(true);
    expect(Buffer.from(res.output)).toEqual(Buffer.from(input));
  });

  it("modexp computes 2^3 mod 5", () => {
    // Header: base_len=1, exp_len=1, mod_len=1
    const header = new Uint8Array(96);
    header.set(beBytes32(1n), 0);
    header.set(beBytes32(1n), 32);
    header.set(beBytes32(1n), 64);
    const tail = new Uint8Array([2, 3, 5]); // base, exp, mod
    const input = new Uint8Array(96 + 3);
    input.set(header, 0);
    input.set(tail, 96);

    const res = evmModexp(input, 1000000n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(1);
    expect(res.output[0]).toBe(3);
  });

  it("bn254Add infinity + infinity = infinity", () => {
    const input = new Uint8Array(128); // two zero points
    const res = evmBn254Add(input, 150n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(64);
    expect([...res.output].every((b) => b === 0)).toBe(true);
  });

  it("bn254Mul infinity * 0 = infinity", () => {
    const input = new Uint8Array(96); // point(0) + scalar(0)
    const res = evmBn254Mul(input, 6000n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(64);
    expect([...res.output].every((b) => b === 0)).toBe(true);
  });

  it("bn254Pairing with zero pairs returns 1", () => {
    const input = new Uint8Array(0);
    const res = evmBn254Pairing(input, 45000n);
    expect(res.success).toBe(true);
    expect(res.output.length).toBe(32);
    expect(res.output[31]).toBe(1);
  });
});

