/**
 * @fileoverview Effect wrapper for Hex.slice.
 * Extracts a portion of Hex by byte indices.
 * @module voltaire-effect/primitives/Hex/slice
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidSizeError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Slice Hex string by byte indices.
 *
 * @param hex - Hex string to slice
 * @param start - Start byte index
 * @param end - End byte index (optional)
 * @returns Effect with sliced HexType or InvalidSizeError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const sliced = yield* Hex.slice('0x123456', 1)      // '0x3456'
 * const range = yield* Hex.slice('0x123456', 0, 1)   // '0x12'
 * ```
 *
 * @since 0.1.0
 */
export const slice = (
	hex: HexType,
	start: number,
	end?: number,
): Effect.Effect<HexType, InvalidSizeError> =>
	Effect.try({
		try: () => VoltaireHex.slice(hex, start, end),
		catch: (e) => e as InvalidSizeError,
	});
