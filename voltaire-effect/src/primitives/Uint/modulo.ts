/**
 * @fileoverview Effect-based Uint256 modulo operation.
 * @module modulo
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Modulo operation on Uint256 values.
 *
 * @description
 * Computes remainder (a % b). Fails if divisor is zero.
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Effect yielding remainder
 *
 * @example
 * ```typescript
 * const remainder = Effect.runSync(Uint.modulo(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const modulo = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.modulo(a, b),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
