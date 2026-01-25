/**
 * @fileoverview Finds an error in an ABI by name.
 * Provides Effect-based wrapper for looking up errors.
 *
 * @module Abi/findError
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Item, Error as AbiError } from '@tevm/voltaire/Abi'

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = Parameters<typeof Item.getItem>[0]

/**
 * Finds an error in an ABI by name.
 *
 * @description
 * Searches the ABI for an error with the given name.
 * Returns the error definition or undefined if not found.
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} name - The error name to find.
 * @returns {Effect.Effect<AbiError.ErrorType | undefined, never>}
 *   Effect yielding the error or undefined.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { findError } from 'voltaire-effect/primitives/Abi'
 *
 * const err = Effect.runSync(findError(abi, 'InsufficientBalance'))
 * if (err) {
 *   console.log(err.inputs)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const findError = (
  abi: AbiInput,
  name: string
): Effect.Effect<AbiError.ErrorType | undefined, never> =>
  Effect.sync(() => Item.getItem(abi, name, 'error') as AbiError.ErrorType | undefined)
