import { DecodedData } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { DecodedDataType } from './DecodedDataSchema.js'

/**
 * Error thrown when decoded data operations fail.
 * @since 0.0.1
 */
export class DecodedDataError extends Error {
  readonly _tag = 'DecodedDataError'
  constructor(message: string) {
    super(message)
    this.name = 'DecodedDataError'
  }
}

/**
 * Creates DecodedData from values and their ABI types.
 *
 * @param values - The decoded values
 * @param types - Array of ABI type strings
 * @returns Effect yielding DecodedDataType or failing with DecodedDataError
 * @example
 * ```typescript
 * import * as DecodedData from 'voltaire-effect/DecodedData'
 * import { Effect } from 'effect'
 *
 * const program = DecodedData.from([100n, '0x...'], ['uint256', 'address'])
 * const decoded = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = <T>(values: T, types: readonly string[]): Effect.Effect<DecodedDataType<T>, DecodedDataError> =>
  Effect.try({
    try: () => DecodedData.from(values, types),
    catch: (e) => new DecodedDataError((e as Error).message)
  })
