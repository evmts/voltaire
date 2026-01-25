/**
 * @fileoverview Effect Schema definitions for Ethereum account nonce validation.
 * Provides type-safe schemas for parsing and validating transaction nonces.
 * @module Nonce/NonceSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum account nonce.
 *
 * @description
 * A nonce is a counter that tracks the number of transactions sent from an account.
 * Each transaction from an account must have a unique nonce, and nonces must be
 * used sequentially (0, 1, 2, ...). Nonces are used to:
 * - Prevent replay attacks
 * - Order transactions from the same account
 * - Allow transaction replacement (same nonce, higher gas)
 *
 * @example
 * ```typescript
 * import type { NonceType } from 'voltaire-effect/primitives/Nonce'
 *
 * const nonce: NonceType = 42n as NonceType
 * ```
 *
 * @since 0.0.1
 */
export type NonceType = bigint & { readonly __tag: 'Nonce' }

/**
 * Internal schema declaration for Nonce type validation.
 * Ensures the value is a non-negative bigint.
 *
 * @internal
 */
const NonceTypeSchema = S.declare<NonceType>(
  (u): u is NonceType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Nonce' }
)

/**
 * Effect Schema for validating and parsing Ethereum account nonces.
 *
 * @description
 * Transforms bigint, number, or string inputs into branded NonceType values.
 * Nonces must be non-negative integers and are used to order transactions
 * and prevent replay attacks.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NonceSchema } from 'voltaire-effect/primitives/Nonce'
 *
 * // Parse from bigint
 * const nonce = S.decodeSync(NonceSchema)(42n)
 *
 * // Parse from number
 * const fromNumber = S.decodeSync(NonceSchema)(0)
 *
 * // Parse from string
 * const fromString = S.decodeSync(NonceSchema)('100')
 *
 * // Encode back
 * const encoded = S.encodeSync(NonceSchema)(nonce)
 * ```
 *
 * @throws ParseResult.Type - When the input is negative or cannot be converted
 * @see {@link from} for Effect-wrapped nonce creation
 * @since 0.0.1
 */
export const NonceSchema: S.Schema<NonceType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  NonceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as NonceType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (nonce) => ParseResult.succeed(nonce)
  }
).annotations({ identifier: 'NonceSchema' })
