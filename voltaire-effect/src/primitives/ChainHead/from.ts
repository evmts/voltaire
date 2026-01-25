import { ChainHead } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { ChainHeadInput, ChainHeadType } from './ChainHeadSchema.js'

/**
 * Error thrown when ChainHead creation fails.
 * @since 0.0.1
 */
export class ChainHeadError extends Error {
  readonly _tag = 'ChainHeadError'
  constructor(message: string) {
    super(message)
    this.name = 'ChainHeadError'
  }
}

/**
 * Creates a ChainHead from input data.
 *
 * @param value - Chain head input with number, hash, and timestamp
 * @returns Effect yielding ChainHeadType or failing with ChainHeadError
 * @example
 * ```typescript
 * import * as ChainHead from 'voltaire-effect/ChainHead'
 * import { Effect } from 'effect'
 *
 * const program = ChainHead.from({
 *   number: 19000000n,
 *   hash: '0x...',
 *   timestamp: 1700000000n
 * })
 * const head = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: ChainHeadInput): Effect.Effect<ChainHeadType, ChainHeadError> =>
  Effect.try({
    try: () => ChainHead.from(value as any),
    catch: (e) => new ChainHeadError((e as Error).message)
  })
