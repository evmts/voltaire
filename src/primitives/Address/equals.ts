import type { Address } from "./Address.js";

/**
 * Check if two addresses are equal
 *
 * @param other - Address to compare with
 * @returns True if addresses are identical
 *
 * @example
 * ```typescript
 * if (Address.equals.call(addr1, addr2)) {
 *   console.log("Addresses match");
 * }
 * ```
 */
export function equals(this: Address, other: Address): boolean {
  if (this.length !== other.length) return false;
  for (let i = 0; i < this.length; i++) {
    if (this[i] !== other[i]) return false;
  }
  return true;
}
