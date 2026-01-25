import { BlockHash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockHashType = BlockHash.BlockHashType
type InvalidBlockHashFormatError = BlockHash.InvalidBlockHashFormatError
type InvalidBlockHashLengthError = BlockHash.InvalidBlockHashLengthError

/**
 * Creates a BlockHash from hex string or bytes.
 * Never throws - returns Effect with error in channel.
 * 
 * @param value - 32-byte hex string or Uint8Array
 * @returns Effect yielding BlockHashType or failing with format/length errors
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * 
 * const hash = await Effect.runPromise(BlockHash.from('0x...'))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<BlockHashType, InvalidBlockHashFormatError | InvalidBlockHashLengthError> =>
  Effect.try({
    try: () => BlockHash.from(value),
    catch: (e) => e as InvalidBlockHashFormatError | InvalidBlockHashLengthError
  })
