import type { Address } from "./Address.js";
import * as AddressModule from "./Address.js";

/**
 * Uppercase address hex string
 */
export type Uppercase = Address & { readonly __uppercase: true };

/**
 * Create uppercase address hex string from Address
 *
 * @param addr - Address to format
 * @returns Uppercase address hex string
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const upper = Uppercase.from(addr);
 * // "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
 * ```
 */
export function from(addr: Address): Uppercase {
  const hex = AddressModule.toHex.call(addr);
  return hex.toUpperCase() as Uppercase;
}
