import type { Address } from "./Address.js";

/**
 * Decode Address from ABI-encoded bytes (32 bytes)
 *
 * Extracts the last 20 bytes from 32-byte ABI-encoded address data.
 *
 * @param bytes - 32-byte ABI-encoded data
 * @returns Decoded Address
 * @throws Error if bytes length is not 32
 *
 * @example
 * ```typescript
 * const encoded = new Uint8Array(32);
 * // ... set encoded[12:32] to address bytes ...
 * const addr = Address.fromAbiEncoded(encoded);
 * ```
 */
export function fromAbiEncoded(bytes: Uint8Array): Address {
  if (bytes.length !== 32) {
    throw new Error(`ABI-encoded Address must be exactly 32 bytes, got ${bytes.length}`);
  }
  return bytes.slice(12, 32) as Address;
}
