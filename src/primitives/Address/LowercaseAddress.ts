import type { Address } from "./Address.js";
import * as Hex from "../Hex/index.js";
import * as AddressModule from "./Address.js";

/**
 * Lowercase address hex string
 */
export type Lowercase = Hex.Sized<20> & { readonly __tag: 'Hex'; readonly __variant: 'Address'; readonly __lowercase: true };

/**
 * Create lowercase address hex string from Address
 *
 * @param addr - Address to format
 * @returns Lowercase address hex string
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const lower = Lowercase.from(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function from(addr: Address): Lowercase {
  return AddressModule.toHex.call(addr).toLowerCase() as Lowercase;
}
