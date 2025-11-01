import type { Address } from "./Address.js";

/**
 * Convert Address to ABI-encoded bytes (32 bytes, left-padded)
 *
 * Ethereum ABI encoding pads addresses to 32 bytes by prepending 12 zero bytes.
 *
 * @param this - Address to encode
 * @returns 32-byte ABI-encoded Uint8Array
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const encoded = Address.toAbiEncoded.call(addr);
 * // encoded.length === 32
 * ```
 */
export function toAbiEncoded(this: Address): Uint8Array {
  const result = new Uint8Array(32);
  result.set(this, 12);
  return result;
}
