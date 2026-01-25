import { BlockFilter, FilterId } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockFilterType = BlockFilter.BlockFilterType
type FilterIdType = FilterId.FilterIdType

/**
 * Creates a BlockFilter from a filter ID.
 * Never throws - returns Effect with error in channel.
 * 
 * @param filterId - The filter ID from eth_newBlockFilter
 * @returns Effect yielding BlockFilterType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockFilter from 'voltaire-effect/primitives/BlockFilter'
 * 
 * const filter = await Effect.runPromise(BlockFilter.from(filterId))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (filterId: FilterIdType): Effect.Effect<BlockFilterType, Error> =>
  Effect.try({
    try: () => BlockFilter.from(filterId),
    catch: (e) => e as Error
  })
