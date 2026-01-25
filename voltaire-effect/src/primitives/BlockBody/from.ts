import { BlockBody } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockBodyType = BlockBody.BlockBodyType

/**
 * Creates a BlockBody from transaction and ommer data.
 * Never throws - returns Effect with error in channel.
 * 
 * @param params - Block body construction parameters
 * @returns Effect yielding BlockBodyType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockBody from 'voltaire-effect/primitives/BlockBody'
 * 
 * const body = await Effect.runPromise(BlockBody.from({ transactions, ommers }))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (params: Parameters<typeof BlockBody.from>[0]): Effect.Effect<BlockBodyType, Error> =>
  Effect.try({
    try: () => BlockBody.from(params),
    catch: (e) => e as Error
  })
