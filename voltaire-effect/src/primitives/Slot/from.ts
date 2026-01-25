import { Slot } from '@tevm/voltaire'
import type { SlotType } from './SlotSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when slot parsing or validation fails.
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(Slot.from(-1)).catch(e => {
 *   if (e._tag === 'SlotError') {
 *     console.error('Slot error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SlotError {
  readonly _tag = 'SlotError'
  constructor(readonly message: string) {}
}

/**
 * Creates a Slot from a number, bigint, or string.
 *
 * @param {number | bigint | string} value - The slot number
 * @returns {Effect.Effect<SlotType, SlotError>} Effect containing the Slot or an error
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const slot = Slot.from(12345)
 * Effect.runPromise(slot).then(console.log)
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<SlotType, SlotError> =>
  Effect.try({
    try: () => Slot.from(value),
    catch: (e) => new SlotError((e as Error).message)
  })

/**
 * Converts a Slot to a JavaScript number.
 *
 * @param {SlotType} slot - The slot to convert
 * @returns {number} The slot as a number
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const slot = yield* Slot.from(12345)
 *   return Slot.toNumber(slot) // 12345
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (slot: SlotType): number => Slot.toNumber(slot)

/**
 * Converts a Slot to a bigint.
 *
 * @param {SlotType} slot - The slot to convert
 * @returns {bigint} The slot as a bigint
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const slot = yield* Slot.from(12345)
 *   return Slot.toBigInt(slot) // 12345n
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toBigInt = (slot: SlotType): bigint => Slot.toBigInt(slot)

/**
 * Calculates the epoch number for a given slot.
 * Each epoch contains 32 slots in the beacon chain.
 *
 * @param {SlotType} slot - The slot to convert
 * @returns {bigint} The epoch number
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const slot = yield* Slot.from(64)
 *   return Slot.toEpoch(slot) // 2n (64 / 32 = 2)
 * })
 * ```
 *
 * @since 0.0.1
 */
export const toEpoch = (slot: SlotType): bigint => Slot.toEpoch(slot)

/**
 * Compares two Slots for equality.
 *
 * @param {SlotType} a - First slot
 * @param {SlotType} b - Second slot
 * @returns {boolean} True if slots are equal
 *
 * @example
 * ```typescript
 * import { Slot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const a = yield* Slot.from(100)
 *   const b = yield* Slot.from(100)
 *   return Slot.equals(a, b) // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: SlotType, b: SlotType): boolean => Slot.equals(a, b)
