/**
 * @module Nonce
 * @description Effect Schemas for Ethereum account nonces.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 *
 * function getNextNonce(current: Nonce.NonceType): Nonce.NonceType {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Nonce.Number` | number | NonceType | Non-negative integer nonce |
 * | `Nonce.BigInt` | bigint | NonceType | Non-negative bigint nonce |
 * | `Nonce.Hex` | string | NonceType | Hex-encoded nonce |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 * import * as S from 'effect/Schema'
 *
 * // Decode from number
 * const nonce = S.decodeSync(Nonce.Number)(42)
 *
 * // Decode from hex
 * const fromHex = S.decodeSync(Nonce.Hex)('0x2a')
 *
 * // Encode back
 * const num = S.encodeSync(Nonce.Number)(nonce)
 * ```
 *
 * ## About Nonces
 *
 * A nonce is a counter that tracks the number of transactions sent from an account.
 * Each new transaction from an account must have a nonce one greater than the previous,
 * starting from 0.
 *
 * Nonces serve several purposes:
 * - **Ordering**: Ensure transactions execute in the correct sequence
 * - **Replay protection**: Prevent duplicate transaction execution
 * - **Replacement**: Allow replacing pending transactions with same nonce
 *
 * @since 0.1.0
 */

// Schemas
export { Number, type NonceType } from "./Number.js";
export { BigInt } from "./BigInt.js";
export { Hex } from "./Hex.js";
