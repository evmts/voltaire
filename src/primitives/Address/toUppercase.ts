import type { Address } from "./Address.js";
import * as Uppercase from "./UppercaseAddress.js";

/**
 * Convert Address to uppercase hex string
 *
 * @returns Uppercase hex string
 *
 * @example
 * ```typescript
 * const upper = Address.toUppercase.call(addr);
 * // "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
 * ```
 */
export function toUppercase(this: Address): Uppercase.Uppercase {
  return Uppercase.from(this);
}
