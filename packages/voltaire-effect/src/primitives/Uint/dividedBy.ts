/**
 * @fileoverview Effect-based Uint256 division.
 * @module dividedBy
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Divide two Uint256 values.
 *
 * @description
 * Floor division (a / b). Fails if divisor is zero.
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Effect yielding quotient
 *
 * @example
 * ```typescript
 * const quotient = Effect.runSync(Uint.dividedBy(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const dividedBy = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.dividedBy(a, b),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
