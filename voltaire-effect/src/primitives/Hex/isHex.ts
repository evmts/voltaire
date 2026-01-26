/**
 * @fileoverview Hex type guard function.
 * Checks if a string is a valid hex format.
 * @module voltaire-effect/primitives/Hex/isHex
 * @since 0.0.1
 */

import { Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Check if a string is a valid hex format.
 *
 * @description
 * Validates that a string is a properly formatted hex string with 0x prefix
 * and valid hex characters. Does not throw - returns a boolean. This operation
 * is infallible.
 *
 * @param {string} value - String to check
 * @returns {boolean} true if the value is a valid hex string
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.isHex('0x1234')   // true
 * Hex.isHex('1234')     // false
 * Hex.isHex('0xZZZZ')   // false
 * ```
 *
 * @since 0.0.1
 */
export const isHex = (value: string): boolean => VoltaireHex.isHex(value);
