/**
 * Authorization module for EIP-7702 authorization tuples.
 * Provides Effect-based schemas and functions for account abstraction authorizations.
 * 
 * @example
 * ```typescript
 * import * as Authorization from 'voltaire-effect/primitives/Authorization'
 * import * as Effect from 'effect/Effect'
 * 
 * const signed = await Effect.runPromise(
 *   Authorization.sign({ chainId: 1n, address: contractAddr, nonce: 0n }, privateKey)
 * )
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { AuthorizationSchema, type AuthorizationInput } from './AuthorizationSchema.js'
export { sign, validate, AuthorizationError, type UnsignedAuthorization } from './from.js'
