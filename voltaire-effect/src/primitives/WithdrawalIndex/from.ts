import { WithdrawalIndex } from '@tevm/voltaire'
import type { WithdrawalIndexType } from './WithdrawalIndexSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when withdrawal index creation fails.
 * @since 0.0.1
 */
export class WithdrawalIndexError {
  /** Discriminant tag for error identification */
  readonly _tag = 'WithdrawalIndexError'
  constructor(readonly message: string) {}
}

/**
 * Creates a validated WithdrawalIndex from a number, bigint, or string.
 * 
 * @param value - Non-negative integer (0 to UINT64_MAX)
 * @returns Effect containing the validated WithdrawalIndex or WithdrawalIndexError
 * @since 0.0.1
 */
export const from = (value: number | bigint | string): Effect.Effect<WithdrawalIndexType, WithdrawalIndexError> =>
  Effect.try({
    try: () => WithdrawalIndex.from(value),
    catch: (e) => new WithdrawalIndexError((e as Error).message)
  })

/** Converts a WithdrawalIndex to a bigint. @since 0.0.1 */
export const toBigInt = (value: WithdrawalIndexType): bigint => WithdrawalIndex.toBigInt(value)

/** Converts a WithdrawalIndex to a number. @since 0.0.1 */
export const toNumber = (value: WithdrawalIndexType): number => WithdrawalIndex.toNumber(value)

/** Checks equality of two WithdrawalIndex values. @since 0.0.1 */
export const equals = (a: WithdrawalIndexType, b: WithdrawalIndexType): boolean => WithdrawalIndex.equals(a, b)

/** Maximum value for a withdrawal index (2^64-1). @since 0.0.1 */
export const UINT64_MAX = WithdrawalIndex.UINT64_MAX
