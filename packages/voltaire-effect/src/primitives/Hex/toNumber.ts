/**
 * @fileoverview Effect wrapper for Hex.toNumber.
 * Converts Hex to number.
 * @module voltaire-effect/primitives/Hex/toNumber
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	UnsafeIntegerError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Convert Hex to number.
 *
 * @param hex - Hex string to convert
 * @returns Effect with number or UnsafeIntegerError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const value = yield* Hex.toNumber('0xff')  // 255
 * ```
 *
 * @since 0.1.0
 */
export const toNumber = (
	hex: HexType,
): Effect.Effect<number, UnsafeIntegerError> =>
	Effect.try({
		try: () => VoltaireHex.toNumber(hex),
		catch: (e) => e as UnsafeIntegerError,
	});
