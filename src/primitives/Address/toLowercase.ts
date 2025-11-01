import type { Address } from "./Address.js";
import * as Lowercase from "./LowercaseAddress.js";

/**
 * Convert Address to lowercase hex string
 *
 * @returns Lowercase hex string
 *
 * @example
 * ```typescript
 * const lower = Address.toLowercase.call(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toLowercase(this: Address): Lowercase.Lowercase {
  return Lowercase.from(this);
}
