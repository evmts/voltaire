/**
 * @fileoverview Effect wrapper for Hex.assertSize.
 * Asserts that Hex is exactly the specified size.
 * @module voltaire-effect/primitives/Hex/assertSize
 * @since 0.1.0
 */

import {
	type HexType,
	type Sized,
	Hex as VoltaireHex,
	InvalidLengthError,
} from "@tevm/voltaire/Hex";
import { Effect } from "effect";

/**
 * Assert that Hex is exactly the specified size.
 *
 * @param hex - Hex string to check
 * @param targetSize - Expected size in bytes
 * @returns Effect that succeeds with Sized<T> or fails with InvalidLengthError
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import { Effect } from 'effect'
 *
 * const sized = yield* Hex.assertSize('0x1234', 2)  // succeeds with Sized<2>
 * yield* Hex.assertSize('0x1234', 4)  // fails with InvalidLengthError
 * ```
 *
 * @since 0.1.0
 */
export const assertSize = <TSize extends number>(
	hex: HexType,
	targetSize: TSize,
): Effect.Effect<Sized<TSize>, InvalidLengthError> =>
	Effect.try({
		try: () => VoltaireHex.assertSize(hex, targetSize),
		catch: (e) => e as InvalidLengthError,
	});
