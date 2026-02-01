/**
 * @fileoverview Effect wrapper for Hex.concat.
 * Concatenates multiple Hex strings.
 * @module voltaire-effect/primitives/Hex/concat
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidFormatError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Concatenate multiple Hex strings.
 *
 * @param hexes - Hex strings to concatenate
 * @returns Effect with combined HexType or InvalidFormatError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const combined = yield* Hex.concat('0x1234', '0x5678')  // '0x12345678'
 * ```
 *
 * @since 0.1.0
 */
export const concat = (
	...hexes: readonly HexType[]
): Effect.Effect<HexType, InvalidFormatError> =>
	Effect.try({
		try: () => VoltaireHex.concat(...hexes),
		catch: (e) => e as InvalidFormatError,
	});
