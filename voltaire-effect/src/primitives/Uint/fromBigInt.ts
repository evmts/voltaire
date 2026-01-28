/**
 * @fileoverview Effect-based Uint256 creation from bigint.
 * @module fromBigInt
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Create Uint256 from bigint.
 *
 * @description
 * Fails on negative values or values exceeding 2^256-1.
 *
 * @param value - bigint value
 * @returns Effect yielding Uint256
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.fromBigInt(1000000000000000000n))
 * ```
 *
 * @since 0.0.1
 */
export const fromBigInt = (value: bigint): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.fromBigInt(value),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
