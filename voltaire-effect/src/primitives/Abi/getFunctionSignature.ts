/**
 * @fileoverview Gets the canonical signature of a function.
 * Provides Effect-based wrapper for getting function signatures.
 *
 * @module Abi/getFunctionSignature
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Function as AbiFunction } from '@tevm/voltaire/Abi'

/**
 * Gets the canonical signature of a function.
 *
 * @description
 * Returns the canonical string representation of a function signature,
 * e.g., "transfer(address,uint256)".
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {AbiFunction.FunctionType} fn - The function ABI item.
 * @returns {Effect.Effect<string, never>}
 *   Effect yielding the function signature string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getFunctionSignature } from 'voltaire-effect/primitives/Abi'
 *
 * const fn = { type: 'function', name: 'transfer', inputs: [...] }
 * const sig = Effect.runSync(getFunctionSignature(fn))
 * // 'transfer(address,uint256)'
 * ```
 *
 * @since 0.0.1
 */
export const getFunctionSignature = (
  fn: AbiFunction.FunctionType
): Effect.Effect<string, never> =>
  Effect.sync(() => AbiFunction.getSignature(fn))
