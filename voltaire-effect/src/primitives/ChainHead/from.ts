/**
 * @fileoverview Effect-wrapped functions for creating ChainHead instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module ChainHead/from
 * @since 0.0.1
 */

import { ChainHead } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { ChainHeadInput, ChainHeadType } from './ChainHeadSchema.js'

/**
 * Error thrown when ChainHead creation fails.
 *
 * @description
 * Indicates that the provided input could not be converted to a valid
 * ChainHeadType. This could be due to invalid block numbers, malformed
 * hashes, or invalid timestamps.
 *
 * @example
 * ```typescript
 * import * as ChainHead from 'voltaire-effect/primitives/ChainHead'
 * import * as Effect from 'effect/Effect'
 *
 * const result = Effect.runSyncExit(ChainHead.from({ number: -1n, hash: '', timestamp: 0n }))
 * // Exit.Failure with ChainHeadError
 * ```
 *
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
 * @description
 * Validates and creates a ChainHeadType from block head input. Requires
 * block number, hash, and timestamp. Optionally accepts difficulty values
 * for proof-of-work chain heads.
 *
 * @param value - Chain head input with number, hash, timestamp, and optional difficulty
 * @returns Effect yielding ChainHeadType or failing with ChainHeadError
 *
 * @example
 * ```typescript
 * import * as ChainHead from 'voltaire-effect/primitives/ChainHead'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from block data
 * const head = ChainHead.from({
 *   number: 19000000n,
 *   hash: '0xabc123...',
 *   timestamp: 1700000000n
 * })
 * const result = Effect.runSync(head)
 *
 * // Use in Effect pipeline
 * const program = Effect.gen(function* () {
 *   const currentHead = yield* ChainHead.from(blockData)
 *   return currentHead.number
 * })
 * ```
 *
 * @throws ChainHeadError - When input validation fails
 * @see {@link ChainHeadSchema} for schema-based validation
 * @since 0.0.1
 */
export const from = (value: ChainHeadInput): Effect.Effect<ChainHeadType, ChainHeadError> =>
  Effect.try({
    try: () => ChainHead.from(value as any),
    catch: (e) => new ChainHeadError((e as Error).message)
  })
