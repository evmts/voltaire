/**
 * @fileoverview Effect wrapper for Hex.fromBigInt.
 * Converts a bigint to Hex string.
 * @module voltaire-effect/primitives/Hex/fromBigInt
 * @since 0.1.0
 */

import {
	type HexType,
	Hex as VoltaireHex,
	NegativeNumberError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Convert bigint to Hex string.
 *
 * @param value - BigInt to convert
 * @param size - Optional byte size for padding
 * @returns Effect with HexType or NegativeNumberError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const hex = yield* Hex.fromBigInt(255n)        // '0xff'
 * const padded = yield* Hex.fromBigInt(255n, 2)  // '0x00ff'
 * ```
 *
 * @since 0.1.0
 */
export const fromBigInt = (
	value: bigint,
	size?: number,
): Effect.Effect<HexType, NegativeNumberError> =>
	Effect.try({
		try: () => VoltaireHex.fromBigInt(value, size),
		catch: (e) => e as NegativeNumberError,
	});
