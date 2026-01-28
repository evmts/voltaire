/**
 * @fileoverview Effect wrapper for Hex.from.
 * Parses any input to a validated Hex string.
 * @module voltaire-effect/primitives/Hex/from
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidFormatError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Parse any input (string or Uint8Array) to Hex.
 *
 * @param value - String or bytes to convert
 * @returns Effect with HexType or InvalidFormatError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const hex = yield* Hex.from('0xdeadbeef')
 * const fromBytes = yield* Hex.from(new Uint8Array([0xde, 0xad]))
 * ```
 *
 * @since 0.1.0
 */
export const from = (
	value: string | Uint8Array,
): Effect.Effect<HexType, InvalidFormatError> =>
	Effect.try({
		try: () => VoltaireHex.from(value),
		catch: (e) => e as InvalidFormatError,
	});
