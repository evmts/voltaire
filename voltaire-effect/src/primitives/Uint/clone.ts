/**
 * @fileoverview Effect-based Uint256 clone.
 * @module clone
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Creates a copy of a Uint256.
 *
 * @param uint - Value to clone
 * @returns Effect yielding cloned Uint256
 *
 * @example
 * ```typescript
 * const copy = Effect.runSync(Uint.clone(uint))
 * ```
 *
 * @since 0.0.1
 */
export const clone = (uint: Uint256Type): Effect.Effect<Uint256Type> =>
	Effect.sync(() => Uint256.clone(uint));
