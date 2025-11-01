import type { Address } from "./Address.js";
import { SIZE } from "./constants.js";

/**
 * Convert Address to uint256
 *
 * @returns Bigint representation
 *
 * @example
 * ```typescript
 * const value = Address.toU256.call(addr);
 * ```
 */
export function toU256(this: Address): bigint {
  let result = 0n;
  for (let i = 0; i < SIZE; i++) {
    result = (result << 8n) | BigInt(this[i] ?? 0);
  }
  return result;
}
