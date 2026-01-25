import { ContractResult } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { ContractResultType, SuccessResult, FailureResult } from './ContractResultSchema.js'

/**
 * Error thrown when contract result operations fail.
 * @since 0.0.1
 */
export class ContractResultError extends Error {
  readonly _tag = 'ContractResultError'
  constructor(message: string) {
    super(message)
    this.name = 'ContractResultError'
  }
}

/**
 * Creates a ContractResult from success status and data.
 *
 * @param isSuccess - Whether the call succeeded
 * @param data - Result data or revert reason
 * @returns Effect yielding ContractResultType or failing with ContractResultError
 * @example
 * ```typescript
 * import * as ContractResult from 'voltaire-effect/ContractResult'
 * import { Effect } from 'effect'
 *
 * const program = ContractResult.from(true, '0x...')
 * const result = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (isSuccess: boolean, data: string | Uint8Array): Effect.Effect<ContractResultType, ContractResultError> =>
  Effect.try({
    try: () => ContractResult.from(isSuccess, data),
    catch: (e) => new ContractResultError((e as Error).message)
  })

/**
 * Creates a successful contract result.
 *
 * @param data - The return data from the contract call
 * @returns Effect yielding SuccessResult
 * @example
 * ```typescript
 * import * as ContractResult from 'voltaire-effect/ContractResult'
 * import { Effect } from 'effect'
 *
 * const result = Effect.runSync(ContractResult.success(new Uint8Array([1, 2, 3])))
 * ```
 * @since 0.0.1
 */
export const success = (data: Uint8Array): Effect.Effect<SuccessResult, never> =>
  Effect.succeed(ContractResult.success(data as any))

/**
 * Creates a failed contract result.
 *
 * @param revertReason - The revert reason data
 * @returns Effect yielding FailureResult
 * @example
 * ```typescript
 * import * as ContractResult from 'voltaire-effect/ContractResult'
 * import { Effect } from 'effect'
 *
 * const result = Effect.runSync(ContractResult.failure(revertData))
 * ```
 * @since 0.0.1
 */
export const failure = (revertReason: Uint8Array): Effect.Effect<FailureResult, never> =>
  Effect.succeed(ContractResult.failure(revertReason as any))

/**
 * Checks if a contract result is successful.
 *
 * @param result - The contract result to check
 * @returns Effect yielding true if successful
 * @since 0.0.1
 */
export const isSuccess = (result: ContractResultType): Effect.Effect<boolean, never> =>
  Effect.succeed(ContractResult.isSuccess(result))

/**
 * Checks if a contract result is a failure.
 *
 * @param result - The contract result to check
 * @returns Effect yielding true if failed
 * @since 0.0.1
 */
export const isFailure = (result: ContractResultType): Effect.Effect<boolean, never> =>
  Effect.succeed(ContractResult.isFailure(result))

/**
 * Unwraps a contract result, throwing if it's a failure.
 *
 * @param result - The contract result to unwrap
 * @returns Effect yielding the result data or failing with ContractResultError
 * @since 0.0.1
 */
export const unwrap = (result: ContractResultType): Effect.Effect<Uint8Array, ContractResultError> =>
  Effect.try({
    try: () => ContractResult.unwrap(result),
    catch: (e) => new ContractResultError((e as Error).message)
  })

/**
 * Unwraps a contract result with a default value for failures.
 *
 * @param result - The contract result to unwrap
 * @param defaultValue - Value to return if result is a failure
 * @returns Effect yielding the result data or default value
 * @since 0.0.1
 */
export const unwrapOr = (result: ContractResultType, defaultValue: Uint8Array): Effect.Effect<Uint8Array, never> =>
  Effect.succeed(ContractResult.unwrapOr(result, defaultValue as any))
