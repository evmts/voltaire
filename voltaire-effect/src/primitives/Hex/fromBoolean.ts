/**
 * @fileoverview Effect wrapper for Hex.fromBoolean.
 * Converts a boolean to Hex string.
 * @module voltaire-effect/primitives/Hex/fromBoolean
 * @since 0.1.0
 */

import { type Sized, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Convert boolean to Hex string.
 *
 * This is an infallible operation - booleans always convert cleanly.
 *
 * @param value - Boolean to convert
 * @returns Hex string ('0x01' for true, '0x00' for false)
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.fromBoolean(true)   // '0x01'
 * Hex.fromBoolean(false)  // '0x00'
 * ```
 *
 * @since 0.1.0
 */
export const fromBoolean = (value: boolean): Sized<1> =>
	VoltaireHex.fromBoolean(value);
