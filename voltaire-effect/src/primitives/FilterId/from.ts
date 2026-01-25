import { FilterId } from '@tevm/voltaire'
import type { FilterIdType } from './FilterIdSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when FilterId parsing fails.
 * @since 0.0.1
 */
export class FilterIdError {
  readonly _tag = 'FilterIdError'
  constructor(readonly message: string) {}
}

/**
 * Creates a FilterId from a string value.
 * @param value - The filter ID string (hex format)
 * @returns Effect containing FilterIdType or FilterIdError
 * @example
 * ```ts
 * import * as FilterId from 'voltaire-effect/primitives/FilterId'
 *
 * const id = FilterId.from('0x1')
 * ```
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<FilterIdType, FilterIdError> =>
  Effect.try({
    try: () => FilterId.from(value),
    catch: (e) => new FilterIdError((e as Error).message)
  })
