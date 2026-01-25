import { Withdrawal } from '@tevm/voltaire'
import type { WithdrawalType } from './WithdrawalSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when withdrawal creation fails.
 * @since 0.0.1
 */
export class WithdrawalError {
  /** Discriminant tag for error identification */
  readonly _tag = 'WithdrawalError'
  constructor(readonly message: string) {}
}

type WithdrawalInput = Parameters<typeof Withdrawal.from>[0]

/**
 * Creates a validated Withdrawal from input parameters.
 * 
 * @param params - Withdrawal fields (index, validatorIndex, address, amount)
 * @returns Effect containing the validated Withdrawal or WithdrawalError
 * @since 0.0.1
 */
export const from = (params: WithdrawalInput): Effect.Effect<WithdrawalType, WithdrawalError> =>
  Effect.try({
    try: () => Withdrawal.from(params),
    catch: (e) => new WithdrawalError((e as Error).message)
  })

/** Checks equality of two Withdrawal values. @since 0.0.1 */
export const equals = (a: WithdrawalType, b: WithdrawalType): boolean => Withdrawal.equals(a, b)
