import { Permit, Address } from '@tevm/voltaire'
import type { PermitType } from './PermitSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when Permit creation fails.
 *
 * @example
 * ```typescript
 * import { PermitError } from 'voltaire-effect/primitives/Permit'
 *
 * const error = new PermitError('Invalid address format')
 * console.log(error._tag) // 'PermitError'
 * ```
 *
 * @since 0.0.1
 */
export class PermitError {
  /** Discriminant tag for error identification */
  readonly _tag = 'PermitError'
  /**
   * Creates a new PermitError.
   * @param message - Error description
   */
  constructor(readonly message: string) {}
}

/**
 * Input parameters for creating a Permit.
 * @since 0.0.1
 */
export type PermitInput = {
  /** Token owner address */
  owner: string | Uint8Array
  /** Approved spender address */
  spender: string | Uint8Array
  /** Amount to approve */
  value: bigint
  /** Owner's current nonce */
  nonce: bigint
  /** Permit expiration timestamp */
  deadline: bigint
}

/**
 * Creates a Permit from input parameters using Effect for error handling.
 *
 * @param input - Permit input with owner, spender, value, nonce, and deadline
 * @returns Effect that succeeds with PermitType or fails with PermitError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/Permit'
 *
 * const permit = from({
 *   owner: '0x1234567890123456789012345678901234567890',
 *   spender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
 *   value: 1000000000000000000n, // 1 token
 *   nonce: 0n,
 *   deadline: 1700000000n
 * })
 *
 * Effect.runSync(permit)
 * ```
 *
 * @since 0.0.1
 */
export const from = (input: PermitInput): Effect.Effect<PermitType, PermitError> =>
  Effect.try({
    try: () => ({
      owner: typeof input.owner === 'string' ? Address(input.owner) : input.owner as Permit.PermitType['owner'],
      spender: typeof input.spender === 'string' ? Address(input.spender) : input.spender as Permit.PermitType['spender'],
      value: input.value as Permit.PermitType['value'],
      nonce: input.nonce as Permit.PermitType['nonce'],
      deadline: input.deadline as Permit.PermitType['deadline'],
    }) as PermitType,
    catch: (e) => new PermitError((e as Error).message)
  })
