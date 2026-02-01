/**
 * @fileoverview Effect wrapper for Hex.padRight.
 * Right-pads Hex to target size with zeros.
 * @module voltaire-effect/primitives/Hex/padRight
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidSizeError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Right-pad Hex to target size with zeros.
 *
 * @param hex - Hex string to pad
 * @param targetSize - Target size in bytes
 * @returns Effect with padded HexType or InvalidSizeError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const padded = yield* Hex.padRight('0x12', 4)  // '0x12000000'
 * ```
 *
 * @since 0.1.0
 */
export const padRight = (
	hex: HexType,
	targetSize: number,
): Effect.Effect<HexType, InvalidSizeError> =>
	Effect.try({
		try: () => VoltaireHex.padRight(hex, targetSize) as HexType,
		catch: (e) => e as InvalidSizeError,
	});
