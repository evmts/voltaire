import { ValidatorIndex } from '@tevm/voltaire'
import type { ValidatorIndexType } from './ValidatorIndexSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when validator index creation fails.
 * @since 0.0.1
 */
export class ValidatorIndexError {
  /** Discriminant tag for error identification */
  readonly _tag = 'ValidatorIndexError'
  constructor(readonly message: string) {}
}

/**
 * Creates a validated ValidatorIndex from a number, bigint, or string.
 * 
 * @param value - Non-negative integer representing the validator index
 * @returns Effect containing the validated ValidatorIndex or ValidatorIndexError
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<ValidatorIndexType, ValidatorIndexError> =>
  Effect.try({
    try: () => ValidatorIndex.from(value),
    catch: (e) => new ValidatorIndexError((e as Error).message)
  })

/** Converts a ValidatorIndex to a number. @since 0.0.1 */
export const toNumber = (value: ValidatorIndexType): number => ValidatorIndex.toNumber(value)

/** Checks equality of two ValidatorIndex values. @since 0.0.1 */
export const equals = (a: ValidatorIndexType, b: ValidatorIndexType): boolean => ValidatorIndex.equals(a, b)
