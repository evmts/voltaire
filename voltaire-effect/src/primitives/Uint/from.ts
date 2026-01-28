/**
 * @fileoverview Effect-based Uint256 creation from various inputs.
 * @module from
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Create Uint256 from bigint, number, or string.
 *
 * @description
 * Accepts decimal strings, hex strings (0x-prefixed), numbers, or bigints.
 * Fails on invalid format, negative values, or overflow.
 *
 * @param value - Input value
 * @returns Effect yielding Uint256
 *
 * @example
 * ```typescript
 * const a = Effect.runSync(Uint.from(100n))
 * const b = Effect.runSync(Uint.from("0xff"))
 * const c = Effect.runSync(Uint.from(42))
 * ```
 *
 * @since 0.0.1
 */
export const from = (
	value: bigint | number | string,
): Effect.Effect<Uint256Type, Error> =>
	Effect.try({
		try: () => Uint256.from(value),
		catch: (e) => (e instanceof Error ? e : new Error(String(e))),
	});
