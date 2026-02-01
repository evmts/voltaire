/**
 * @module is
 * @description Type guard to check if value is an AddressType
 * @since 0.1.0
 */
import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Type guard: check if value is an AddressType
 *
 * @param value - Value to check
 * @returns True if value is AddressType
 * @example
 * ```typescript
 * if (Address.is(value)) {
 *   // value is AddressType
 * }
 * ```
 */
export const is = (value: unknown): value is AddressType => Address.is(value);
