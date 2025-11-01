import type { Address } from "./Address.js";
import * as Rlp from "../Rlp/index.js";
import * as Hash from "../Hash/index.js";
import { InvalidValueError } from "./errors.js";

/**
 * Calculate CREATE contract address
 *
 * address = keccak256(rlp([sender, nonce]))[12:32]
 *
 * @param nonce - Transaction nonce
 * @returns Calculated contract address
 * @throws {InvalidValueError} If nonce is negative
 *
 * @example
 * ```typescript
 * const contractAddr = Address.calculateCreateAddress.call(deployerAddr, 5n);
 * ```
 */
export function calculateCreateAddress(this: Address, nonce: bigint): Address {
  if (nonce < 0n) {
    throw new InvalidValueError("Nonce cannot be negative");
  }

  let nonceBytes: Uint8Array;
  if (nonce === 0n) {
    nonceBytes = new Uint8Array(0);
  } else {
    const hex = nonce.toString(16);
    const hexPadded = hex.length % 2 === 0 ? hex : `0${hex}`;
    const byteLength = hexPadded.length / 2;
    nonceBytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      nonceBytes[i] = Number.parseInt(hexPadded.slice(i * 2, i * 2 + 2), 16);
    }
  }

  const encoded = Rlp.encode.call([this, nonceBytes]);
  const hash = Hash.keccak256(encoded) as unknown as Uint8Array;
  return hash.slice(12, 32) as Address;
}
