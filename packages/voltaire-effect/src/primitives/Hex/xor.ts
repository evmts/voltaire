/**
 * @fileoverview Effect wrapper for Hex.xor.
 * XORs two Hex strings.
 * @module voltaire-effect/primitives/Hex/xor
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidLengthError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * XOR two Hex strings.
 *
 * @param hex - First Hex string
 * @param other - Second Hex string
 * @returns Effect with XOR result or InvalidLengthError if lengths don't match
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const result = yield* Hex.xor('0xff00', '0x00ff')  // '0xffff'
 * ```
 *
 * @since 0.1.0
 */
export const xor = (
	hex: HexType,
	other: HexType,
): Effect.Effect<HexType, InvalidLengthError> =>
	Effect.try({
		try: () => VoltaireHex.xor(hex, other),
		catch: (e) => e as InvalidLengthError,
	});
