/**
 * @fileoverview Authorization module for EIP-7702 authorization tuples.
 * 
 * EIP-7702 introduces authorization tuples that allow EOAs (Externally Owned Accounts)
 * to delegate execution to smart contracts. This enables EOAs to temporarily act
 * as smart contract accounts, bringing account abstraction features to existing EOAs.
 * 
 * This module provides Effect-based schemas and functions for creating, signing,
 * and validating authorization tuples.
 * 
 * @example
 * ```typescript
 * import * as Authorization from 'voltaire-effect/primitives/Authorization'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   // Sign an authorization
 *   const signed = yield* Authorization.sign(
 *     { chainId: 1n, address: contractAddr, nonce: 0n },
 *     privateKey
 *   )
 *   
 *   // Validate the authorization
 *   yield* Authorization.validate(signed)
 *   
 *   return signed
 * })
 * ```
 * 
 * @see https://eips.ethereum.org/EIPS/eip-7702
 * @module Authorization
 * @since 0.0.1
 */

/** Schema and types for Authorization */
export { AuthorizationSchema, type AuthorizationInput } from './AuthorizationSchema.js'

/** Functions for signing and validating authorizations */
export { sign, validate, AuthorizationError, type UnsignedAuthorization } from './from.js'
