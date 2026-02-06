/**
 * @fileoverview Effect-based Uint256 try-from with Option result.
 * @module tryFrom
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Option from "effect/Option";

/**
 * Try to create Uint256, returns Option.
 *
 * @description
 * Returns Some(value) on success, None on failure.
 * Does not throw.
 *
 * @param value - Input value
 * @returns Option of Uint256
 *
 * @example
 * ```typescript
 * const result = Uint.tryFrom(100n) // Some(100n)
 * const invalid = Uint.tryFrom(-1n) // None
 * ```
 *
 * @since 0.0.1
 */
export const tryFrom = (
	value: bigint | number | string,
): Option.Option<Uint256Type> => Option.fromNullable(Uint256.tryFrom(value));
