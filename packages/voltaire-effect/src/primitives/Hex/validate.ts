/**
 * @fileoverview Effect wrapper for Hex.validate.
 * Validates and returns Hex string.
 * @module voltaire-effect/primitives/Hex/validate
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	InvalidFormatError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Validate and return Hex string.
 *
 * @param value - String to validate
 * @returns Effect with validated HexType or InvalidFormatError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const valid = yield* Hex.validate('0x1234')
 * ```
 *
 * @since 0.1.0
 */
export const validate = (
	value: string,
): Effect.Effect<HexType, InvalidFormatError> =>
	Effect.try({
		try: () => VoltaireHex.validate(value),
		catch: (e) => e as InvalidFormatError,
	});
