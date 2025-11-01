import type { Address } from "./Address.js";
import { SIZE } from "./constants.js";

/**
 * Type guard for Address (standard form)
 *
 * @param value - Value to check
 * @returns True if value is an Address
 *
 * @example
 * ```typescript
 * if (Address.is(value)) {
 *   const hex = Address.toHex(value);
 * }
 * ```
 */
export function is(value: unknown): value is Address {
  return value instanceof Uint8Array && value.length === SIZE;
}
