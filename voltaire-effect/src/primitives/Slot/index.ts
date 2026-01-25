/**
 * @module Slot
 *
 * Effect-based module for working with beacon chain slot numbers.
 * Slots are 12-second time periods in Ethereum's consensus layer.
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const slot = yield* Slot.from(12345)
 *   const epoch = Slot.toEpoch(slot)
 *   return epoch
 * })
 * ```
 *
 * @since 0.0.1
 */
export { Schema, type SlotType } from './SlotSchema.js'
export { from, toNumber, toBigInt, toEpoch, equals, SlotError } from './from.js'
