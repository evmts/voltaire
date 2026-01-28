/**
 * @fileoverview Effect wrapper for Hex.fromString.
 * Converts a UTF-8 string to Hex (encodes string bytes).
 * @module voltaire-effect/primitives/Hex/fromString
 * @since 0.1.0
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Convert UTF-8 string to Hex (encodes string bytes).
 *
 * This is an infallible operation - any string can be encoded.
 *
 * @param value - UTF-8 string to encode
 * @returns Hex-encoded string bytes
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.fromString('hello')  // '0x68656c6c6f'
 * ```
 *
 * @since 0.1.0
 */
export const fromString = (value: string): HexType =>
	VoltaireHex.fromString(value);
