/**
 * @fileoverview Effect wrapper for Hex.toBoolean.
 * Converts Hex to boolean.
 * @module voltaire-effect/primitives/Hex/toBoolean
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidBooleanHexError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Convert Hex to boolean.
 *
 * @param hex - Hex string ('0x01'/'0x1' for true, '0x00'/'0x0' for false)
 * @returns Effect with boolean or InvalidBooleanHexError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const t = yield* Hex.toBoolean('0x01')  // true
 * const f = yield* Hex.toBoolean('0x00')  // false
 * ```
 *
 * @since 0.1.0
 */
export const toBoolean = (
	hex: HexType,
): Effect.Effect<boolean, InvalidBooleanHexError> =>
	Effect.try({
		try: () => VoltaireHex.toBoolean(hex),
		catch: (e) => e as InvalidBooleanHexError,
	});
