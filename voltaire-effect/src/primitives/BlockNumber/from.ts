import { BlockNumber } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BlockNumberType = BlockNumber.BlockNumberType
type InvalidBlockNumberError = BlockNumber.InvalidBlockNumberError

/**
 * Creates a BlockNumber from a number or bigint.
 * Validates that value is non-negative.
 * Never throws - returns Effect with error in channel.
 * 
 * @param value - Non-negative number or bigint
 * @returns Effect yielding BlockNumberType or failing with InvalidBlockNumberError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * 
 * const blockNum = await Effect.runPromise(BlockNumber.from(12345n))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: number | bigint): Effect.Effect<BlockNumberType, InvalidBlockNumberError> =>
  Effect.try({
    try: () => BlockNumber.from(value),
    catch: (e) => e as InvalidBlockNumberError
  })
