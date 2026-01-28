/**
 * @fileoverview Effect wrapper for Hex.toString.
 * Decodes Hex to UTF-8 string.
 * @module voltaire-effect/primitives/Hex/toStringHex
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidFormatError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Decode Hex to UTF-8 string.
 *
 * Note: Named `toStringHex` to avoid conflict with native `toString`.
 *
 * @param hex - Hex string to decode
 * @returns Effect with decoded string or InvalidFormatError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const str = yield* Hex.toStringHex('0x68656c6c6f')  // 'hello'
 * ```
 *
 * @since 0.1.0
 */
export const toStringHex = (
	hex: HexType,
): Effect.Effect<string, InvalidFormatError> =>
	Effect.try({
		try: () => VoltaireHex.toString(hex),
		catch: (e) => e as InvalidFormatError,
	});
