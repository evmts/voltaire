import type { Address } from "./Address.js";
import * as Checksummed from "./ChecksumAddress.js";

/**
 * Convert Address to EIP-55 checksummed hex string
 *
 * @returns Checksummed hex string with mixed case
 *
 * @example
 * ```typescript
 * const checksummed = Address.toChecksummed.call(addr);
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function toChecksummed(this: Address): Checksummed.Checksummed {
  return Checksummed.from(this);
}
