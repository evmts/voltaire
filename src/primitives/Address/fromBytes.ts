import type { Address } from "./Address.js";
import { SIZE } from "./constants.js";
import { InvalidAddressLengthError } from "./errors.js";

/**
 * Create Address from raw bytes (standard form)
 *
 * @param bytes - Raw 20-byte array
 * @returns Address
 * @throws If length is not 20 bytes
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array(20);
 * const addr = Address.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): Address {
  if (bytes.length !== SIZE) {
    throw new InvalidAddressLengthError();
  }
  return new Uint8Array(bytes) as Address;
}
