/**
 * Nonce module for working with Ethereum account nonces in Effect.
 * A nonce is a counter that tracks the number of transactions sent from an account.
 * Each new transaction must have a nonce one greater than the previous.
 *
 * @example
 * ```typescript
 * import * as Nonce from 'voltaire-effect/Nonce'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a nonce
 * const nonce = Effect.runSync(Nonce.from(42n))
 *
 * // Using the Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(Nonce.NonceSchema)(0)
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { NonceSchema, type NonceType } from './NonceSchema.js'
export { from } from './from.js'
