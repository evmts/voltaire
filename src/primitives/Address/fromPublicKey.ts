import type { Address } from "./Address.js";
import * as Hash from "../Hash/index.js";

/**
 * Create Address from secp256k1 public key (standard form)
 *
 * @param x - Public key x coordinate
 * @param y - Public key y coordinate
 * @returns Address derived from keccak256(pubkey)[12:32]
 *
 * @example
 * ```typescript
 * const addr = Address.fromPublicKey(xCoord, yCoord);
 * ```
 */
export function fromPublicKey(x: bigint, y: bigint): Address {
  const pubkey = new Uint8Array(64);
  for (let i = 31; i >= 0; i--) {
    pubkey[31 - i] = Number((x >> BigInt(i * 8)) & 0xffn);
    pubkey[63 - i] = Number((y >> BigInt(i * 8)) & 0xffn);
  }
  const hash = Hash.keccak256(pubkey) as unknown as Uint8Array;
  return hash.slice(12, 32) as Address;
}
