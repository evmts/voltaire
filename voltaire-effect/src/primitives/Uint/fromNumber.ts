/**
 * @fileoverview Effect-based Uint256 creation from number.
 * @module fromNumber
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Create Uint256 from number.
 *
 * @description
 * Fails on negative, non-integer, or unsafe integer values.
 *
 * @param value - Number value
 * @returns Effect yielding Uint256
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.fromNumber(42))
 * ```
 *
 * @since 0.0.1
 */
export const fromNumber = (value: number): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.fromNumber(value),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
