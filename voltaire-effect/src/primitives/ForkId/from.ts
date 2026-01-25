import { ForkId } from '@tevm/voltaire'
import type { ForkIdType, ForkIdInput } from './ForkIdSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when ForkId creation fails.
 * @since 0.0.1
 */
export class ForkIdError {
  readonly _tag = 'ForkIdError'
  constructor(readonly message: string) {}
}

/**
 * Creates a ForkId from hash and next block number.
 * @param value - Object containing hash bytes and next fork block
 * @returns Effect containing ForkIdType or ForkIdError
 * @example
 * ```ts
 * import * as ForkId from 'voltaire-effect/primitives/ForkId'
 *
 * const id = ForkId.from({
 *   hash: new Uint8Array([0xfc, 0x64, 0xec, 0x04]),
 *   next: 1150000n
 * })
 * ```
 * @since 0.0.1
 */
export const from = (value: ForkIdInput): Effect.Effect<ForkIdType, ForkIdError> =>
  Effect.try({
    try: () => ForkId.from(value),
    catch: (e) => new ForkIdError((e as Error).message)
  })
