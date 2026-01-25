/**
 * @fileoverview Nonce module for working with Ethereum account nonces in Effect.
 * A nonce is a counter that tracks the number of transactions sent from an account.
 *
 * @description
 * This module provides both Effect-wrapped constructors and Effect Schemas for
 * working with Ethereum transaction nonces. Each new transaction from an account
 * must have a nonce one greater than the previous, starting from 0.
 *
 * Nonces serve several purposes:
 * - **Ordering**: Ensure transactions execute in the correct sequence
 * - **Replay protection**: Prevent duplicate transaction execution
 * - **Replacement**: Allow replacing pending transactions with same nonce
 *
 * @example
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Using Effect-wrapped constructor
 * const nonce = Effect.runSync(Nonce.from(42n))
 *
 * // Using Schema for validation
 * const parsed = S.decodeSync(Nonce.NonceSchema)(0)
 *
 * // In Effect pipeline
 * const program = Effect.gen(function* () {
 *   const currentNonce = yield* Nonce.from(lastNonce)
 *   const nextNonce = yield* Nonce.from(lastNonce + 1n)
 *   return nextNonce
 * })
 * ```
 *
 * @module Nonce
 * @since 0.0.1
 * @see {@link NonceSchema} for schema-based validation
 * @see {@link from} for Effect-wrapped creation
 */
export { NonceSchema, type NonceType } from './NonceSchema.js'
export { from } from './from.js'
