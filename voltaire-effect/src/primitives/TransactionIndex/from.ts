import { TransactionIndex } from '@tevm/voltaire'
import type { TransactionIndexType } from './TransactionIndexSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when transaction index creation fails.
 * 
 * @example
 * ```typescript
 * import { TransactionIndexError } from './from.js'
 * 
 * const error = new TransactionIndexError('Index must be non-negative')
 * ```
 * 
 * @since 0.0.1
 */
export class TransactionIndexError {
  /** Discriminant tag for error identification */
  readonly _tag = 'TransactionIndexError'
  
  /**
   * Creates a new TransactionIndexError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Creates a validated TransactionIndex from a number or bigint.
 * 
 * @param value - Non-negative integer representing transaction position
 * @returns Effect containing the validated TransactionIndex or TransactionIndexError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const index = await Effect.runPromise(from(5))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: number | bigint): Effect.Effect<TransactionIndexType, TransactionIndexError> =>
  Effect.try({
    try: () => TransactionIndex.from(value),
    catch: (e) => new TransactionIndexError((e as Error).message)
  })

/**
 * Converts a TransactionIndex to a number.
 * 
 * @param value - TransactionIndex to convert
 * @returns The index as a number
 * 
 * @example
 * ```typescript
 * import { toNumber } from './from.js'
 * 
 * const num = toNumber(index) // 5
 * ```
 * 
 * @since 0.0.1
 */
export const toNumber = (value: TransactionIndexType): number => TransactionIndex.toNumber(value)

/**
 * Checks if two TransactionIndex values are equal.
 * 
 * @param a - First TransactionIndex
 * @param b - Second TransactionIndex
 * @returns True if equal, false otherwise
 * 
 * @example
 * ```typescript
 * import { equals } from './from.js'
 * 
 * const isEqual = equals(index1, index2)
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: TransactionIndexType, b: TransactionIndexType): boolean => TransactionIndex.equals(a, b)
