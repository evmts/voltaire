import type { Address } from "./Address.js";
import * as Hash from "../Hash/index.js";
import { SIZE } from "./constants.js";

/**
 * Calculate CREATE2 contract address
 *
 * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
 *
 * @param salt - 32-byte salt
 * @param initCode - Contract initialization code
 * @returns Calculated contract address
 *
 * @example
 * ```typescript
 * const contractAddr = Address.calculateCreate2Address.call(
 *   deployerAddr,
 *   saltBytes,
 *   initCode
 * );
 * ```
 */
export function calculateCreate2Address(
  this: Address,
  salt: Uint8Array,
  initCode: Uint8Array,
): Address {
  if (salt.length !== 32) {
    throw new Error("Salt must be 32 bytes");
  }

  const initCodeHash = Hash.keccak256(initCode) as unknown as Uint8Array;
  const data = new Uint8Array(1 + SIZE + 32 + 32);
  data[0] = 0xff;
  data.set(this, 1);
  data.set(salt, 1 + SIZE);
  data.set(initCodeHash, 1 + SIZE + 32);

  const hash = Hash.keccak256(data) as unknown as Uint8Array;
  return hash.slice(12, 32) as Address;
}
