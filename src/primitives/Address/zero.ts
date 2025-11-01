import type { Address } from "./Address.js";
import { SIZE } from "./constants.js";

/**
 * Create zero address (standard form)
 *
 * @returns Zero address (0x0000...0000)
 *
 * @example
 * ```typescript
 * const zero = Address.zero();
 * ```
 */
export function zero(): Address {
  return new Uint8Array(SIZE) as Address;
}
