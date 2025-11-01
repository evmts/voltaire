import type { Address } from "./Address.js";
import { SIZE } from "./constants.js";

/**
 * Compare two addresses lexicographically
 *
 * @param other - Address to compare with
 * @returns -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const sorted = addresses.sort((a, b) => Address.compare.call(a, b));
 * ```
 */
export function compare(this: Address, other: Address): number {
  for (let i = 0; i < SIZE; i++) {
    const thisByte = this[i] ?? 0;
    const otherByte = other[i] ?? 0;
    if (thisByte < otherByte) return -1;
    if (thisByte > otherByte) return 1;
  }
  return 0;
}
