import type { Address } from "./Address.js";
import { toHex } from "./toHex.js";

/**
 * Format address with shortened display
 *
 * @param prefixLength - Number of chars to show at start (default: 6)
 * @param suffixLength - Number of chars to show at end (default: 4)
 * @returns Shortened address like "0x742d...51e3"
 *
 * @example
 * ```typescript
 * const short = Address.toShortHex.call(addr);
 * // "0x742d...51e3"
 * const custom = Address.toShortHex.call(addr, 8, 6);
 * // "0x742d35...251e3"
 * ```
 */
export function toShortHex(this: Address, prefixLength?: number, suffixLength?: number): string {
  const prefix = prefixLength ?? 6;
  const suffix = suffixLength ?? 4;

  const hex = toHex.call(this);
  if (prefix + suffix >= 40) return hex;
  return `${hex.slice(0, 2 + prefix)}...${hex.slice(-suffix)}`;
}
