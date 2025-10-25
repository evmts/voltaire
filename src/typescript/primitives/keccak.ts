/**
 * Keccak-256 hashing using @noble/hashes
 */

import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Compute Keccak-256 hash of input data
 */
export function keccak256(data: Uint8Array): Uint8Array {
  return keccak_256(data);
}

/**
 * Compute Keccak-256 hash of hex string
 */
export function keccak256Hex(hex: string): string {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);

  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }

  const hash = keccak256(bytes);
  return "0x" + Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
