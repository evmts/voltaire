/**
 * @fileoverview Effect-based Uint256 creation from various inputs.
 * @module from
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";
import { ValidationError } from "@tevm/voltaire/errors";

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
): Effect.Effect<Uint256Type, ValidationError> =>
	Effect.try({
		try: () => Uint256.from(value),
		catch: (error) =>
			new ValidationError(
				error instanceof Error ? error.message : "Invalid Uint256 input",
				{
					value,
					expected: "bigint, number, or string (decimal or hex)",
					cause: error instanceof Error ? error : undefined,
				},
			),
	});
