import type { Address } from "./Address.js";
import { toChecksummed } from "./toChecksummed.js";

/**
 * Format address for display (checksummed)
 *
 * @returns Checksummed hex string
 *
 * @example
 * ```typescript
 * console.log(Address.format.call(addr));
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function format(this: Address): string {
  return toChecksummed.call(this);
}
