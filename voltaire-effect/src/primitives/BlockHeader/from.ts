import { BlockHeader } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockHeaderType = BlockHeader.BlockHeaderType

/**
 * Creates a BlockHeader from header parameters.
 * Never throws - returns Effect with error in channel.
 * 
 * @param params - Block header fields (parentHash, stateRoot, number, etc.)
 * @returns Effect yielding BlockHeaderType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 * 
 * const header = await Effect.runPromise(BlockHeader.from({ parentHash, ... }))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (params: Parameters<typeof BlockHeader.from>[0]): Effect.Effect<BlockHeaderType, Error> =>
  Effect.try({
    try: () => BlockHeader.from(params),
    catch: (e) => e as Error
  })
