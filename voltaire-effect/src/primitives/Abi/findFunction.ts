/**
 * @fileoverview Finds a function in an ABI by name.
 * Provides Effect-based wrapper for looking up functions.
 *
 * @module Abi/findFunction
 * @since 0.0.1
 */

import { type Function as AbiFunction, Item } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = Parameters<typeof Item.getItem>[0];

/**
 * Finds a function in an ABI by name.
 *
 * @description
 * Searches the ABI for a function with the given name.
 * Returns the function definition or undefined if not found.
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} name - The function name to find.
 * @returns {Effect.Effect<AbiFunction.FunctionType | undefined, never>}
 *   Effect yielding the function or undefined.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { findFunction } from 'voltaire-effect/primitives/Abi'
 *
 * const fn = Effect.runSync(findFunction(abi, 'transfer'))
 * if (fn) {
 *   console.log(fn.inputs)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const findFunction = (
	abi: AbiInput,
	name: string,
): Effect.Effect<AbiFunction.FunctionType | undefined, never> =>
	Effect.sync(
		() =>
			Item.getItem(abi, name, "function") as
				| AbiFunction.FunctionType
				| undefined,
	);
