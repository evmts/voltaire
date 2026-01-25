import { Authorization, type AuthorizationType } from '@tevm/voltaire/Authorization'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when authorization validation or signing fails.
 * 
 * @since 0.0.1
 */
export class AuthorizationError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'AuthorizationError'
  
  /**
   * Creates a new AuthorizationError.
   * 
   * @param message - Human-readable error message
   * @param context - Additional error context
   * 
   * @since 0.0.1
   */
  constructor(
    message: string,
    readonly context?: { value?: unknown; expected?: string; cause?: Error }
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Unsigned authorization tuple (before signing).
 * Contains the authorization data without signature components.
 * 
 * @since 0.0.1
 */
export type UnsignedAuthorization = {
  /** Chain ID for replay protection */
  chainId: bigint
  /** Contract address to authorize */
  address: AddressType
  /** Account nonce */
  nonce: bigint
}

/**
 * Signs an unsigned authorization with a private key.
 * Never throws - returns Effect with error in channel.
 * 
 * @param unsigned - The unsigned authorization data
 * @param privateKey - 32-byte private key for signing
 * @returns Effect yielding signed AuthorizationType or failing with AuthorizationError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Authorization from 'voltaire-effect/primitives/Authorization'
 * 
 * const result = await Effect.runPromise(Authorization.sign(
 *   { chainId: 1n, address: contractAddress, nonce: 0n },
 *   privateKey
 * ))
 * ```
 * 
 * @since 0.0.1
 */
export const sign = (
  unsigned: UnsignedAuthorization,
  privateKey: Uint8Array
): Effect.Effect<AuthorizationType, AuthorizationError> =>
  Effect.try({
    try: () => Authorization.sign(unsigned, privateKey),
    catch: (e) => new AuthorizationError(
      e instanceof Error ? e.message : String(e),
      { value: unsigned, expected: 'valid unsigned authorization', cause: e instanceof Error ? e : undefined }
    )
  })

/**
 * Validates an authorization tuple.
 * Checks that all fields are valid and signature is well-formed.
 * Never throws - returns Effect with error in channel.
 * 
 * @param auth - The authorization tuple to validate
 * @returns Effect yielding the validated authorization or failing with AuthorizationError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Authorization from 'voltaire-effect/primitives/Authorization'
 * 
 * const validated = await Effect.runPromise(Authorization.validate(auth))
 * ```
 * 
 * @since 0.0.1
 */
export const validate = (auth: AuthorizationType): Effect.Effect<AuthorizationType, AuthorizationError> =>
  Effect.try({
    try: () => {
      Authorization.validate(auth)
      return auth
    },
    catch: (e) => new AuthorizationError(
      e instanceof Error ? e.message : String(e),
      { value: auth, expected: 'valid authorization', cause: e instanceof Error ? e : undefined }
    )
  })
