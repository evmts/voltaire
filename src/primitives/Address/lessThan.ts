import type { Address } from "./Address.js";
import { compare } from "./compare.js";

/**
 * Check if this address is less than other
 *
 * @param other - Address to compare with
 * @returns True if this < other
 */
export function lessThan(this: Address, other: Address): boolean {
  return compare.call(this, other) < 0;
}
