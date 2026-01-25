/**
 * @fileoverview Gets the canonical signature of an event.
 * Provides Effect-based wrapper for getting event signatures.
 *
 * @module Abi/getEventSignature
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Event as AbiEvent, type EventType } from '@tevm/voltaire/Abi'

/**
 * Gets the canonical signature of an event.
 *
 * @description
 * Returns the canonical string representation of an event signature,
 * e.g., "Transfer(address,address,uint256)".
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {EventType} event - The event ABI item.
 * @returns {Effect.Effect<string, never>}
 *   Effect yielding the event signature string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getEventSignature } from 'voltaire-effect/primitives/Abi'
 *
 * const evt = { type: 'event', name: 'Transfer', inputs: [...] }
 * const sig = Effect.runSync(getEventSignature(evt))
 * // 'Transfer(address,address,uint256)'
 * ```
 *
 * @since 0.0.1
 */
export const getEventSignature = (
  event: EventType
): Effect.Effect<string, never> =>
  Effect.sync(() => AbiEvent.getSignature(event))
