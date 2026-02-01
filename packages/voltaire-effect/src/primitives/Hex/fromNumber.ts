/**
 * @fileoverview Effect wrapper for Hex.fromNumber.
 * Converts a number to Hex string.
 * @module voltaire-effect/primitives/Hex/fromNumber
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	NegativeNumberError,
	NonIntegerError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Convert number to Hex string.
 *
 * @param value - Number to convert (must be non-negative integer)
 * @param size - Optional byte size for padding
 * @returns Effect with HexType or error
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const hex = yield* Hex.fromNumber(255)      // '0xff'
 * const padded = yield* Hex.fromNumber(255, 2)  // '0x00ff'
 * ```
 *
 * @since 0.1.0
 */
export const fromNumber = (
	value: number,
	size?: number,
): Effect.Effect<HexType, NegativeNumberError | NonIntegerError> =>
	Effect.try({
		try: () => VoltaireHex.fromNumber(value, size),
		catch: (e) => e as NegativeNumberError | NonIntegerError,
	});
