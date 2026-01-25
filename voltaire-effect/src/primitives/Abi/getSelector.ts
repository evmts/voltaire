/**
 * @fileoverview Gets function/event/error selector.
 * Provides Effect-based wrapper for computing selectors.
 *
 * @module Abi/getSelector
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Function as AbiFunction, Event as AbiEvent, Error as AbiError, type Event, type Function, type Error } from '@tevm/voltaire/Abi'
import * as Hex from '@tevm/voltaire/Hex'
import type { HexType } from '@tevm/voltaire/Hex'

/**
 * Gets the selector for a function, event, or error ABI item.
 *
 * @description
 * Computes the selector (first 4 bytes of keccak256 for functions/errors,
 * full 32 bytes for events) from an ABI item.
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {object} item - The ABI item (function, event, or error).
 * @returns {Effect.Effect<HexType, never>}
 *   Effect yielding the selector as hex string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getSelector } from 'voltaire-effect/primitives/Abi'
 *
 * const fn = { type: 'function', name: 'transfer', inputs: [...] }
 * const selector = Effect.runSync(getSelector(fn))
 * // '0xa9059cbb'
 * ```
 *
 * @since 0.0.1
 */
export const getSelector = (
  item: { type: string; name?: string; inputs?: readonly unknown[] }
): Effect.Effect<HexType, never> =>
  Effect.sync(() => {
    if (item.type === 'event') {
      const selector = AbiEvent.getSelector(item as AbiEvent.EventType)
      return Hex.fromBytes(selector)
    }
    if (item.type === 'error') {
      const selector = AbiError.getSelector(item as AbiError.ErrorType)
      return Hex.fromBytes(selector)
    }
    const selector = AbiFunction.getSelector(item as AbiFunction.FunctionType)
    return Hex.fromBytes(selector)
  })
