/**
 * @fileoverview Effect wrapper for Hex.pad.
 * Left-pads Hex to target size with zeros.
 * @module voltaire-effect/primitives/Hex/pad
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	SizeExceededError,
	InvalidSizeError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Left-pad Hex to target size with zeros.
 *
 * @param hex - Hex string to pad
 * @param targetSize - Target size in bytes
 * @returns Effect with padded HexType or SizeExceededError/InvalidSizeError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const padded = yield* Hex.pad('0x12', 4)  // '0x00000012'
 * ```
 *
 * @since 0.1.0
 */
export const pad = (
	hex: HexType,
	targetSize: number,
): Effect.Effect<HexType, SizeExceededError | InvalidSizeError> =>
	Effect.try({
		try: () => VoltaireHex.pad(hex, targetSize) as HexType,
		catch: (e) => e as SizeExceededError | InvalidSizeError,
	});
