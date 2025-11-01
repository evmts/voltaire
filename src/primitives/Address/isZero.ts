import type { Address } from "./Address.js";

/**
 * Check if address is zero address
 *
 * @returns True if all bytes are zero
 *
 * @example
 * ```typescript
 * if (Address.isZero.call(addr)) {
 *   console.log("Zero address");
 * }
 * ```
 */
export function isZero(this: Address): boolean {
  return this.every((b) => b === 0);
}
