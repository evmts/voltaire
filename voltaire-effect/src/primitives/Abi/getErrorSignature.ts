/**
 * @fileoverview Gets the canonical signature of an error.
 * Provides Effect-based wrapper for getting error signatures.
 *
 * @module Abi/getErrorSignature
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Error as AbiError } from '@tevm/voltaire/Abi'

/**
 * Gets the canonical signature of an error.
 *
 * @description
 * Returns the canonical string representation of an error signature,
 * e.g., "InsufficientBalance(uint256)".
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {AbiError.ErrorType} error - The error ABI item.
 * @returns {Effect.Effect<string, never>}
 *   Effect yielding the error signature string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getErrorSignature } from 'voltaire-effect/primitives/Abi'
 *
 * const err = { type: 'error', name: 'InsufficientBalance', inputs: [...] }
 * const sig = Effect.runSync(getErrorSignature(err))
 * // 'InsufficientBalance(uint256)'
 * ```
 *
 * @since 0.0.1
 */
export const getErrorSignature = (
  error: AbiError.ErrorType
): Effect.Effect<string, never> =>
  Effect.sync(() => AbiError.getSignature(error))
