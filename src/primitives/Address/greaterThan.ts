import type { Address } from "./Address.js";
import { compare } from "./compare.js";

/**
 * Check if this address is greater than other
 *
 * @param other - Address to compare with
 * @returns True if this > other
 */
export function greaterThan(this: Address, other: Address): boolean {
  return compare.call(this, other) > 0;
}
