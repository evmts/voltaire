import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum account nonce.
 * A nonce is a counter that tracks the number of transactions sent from an account.
 * @since 0.0.1
 */
export type NonceType = bigint & { readonly __tag: 'Nonce' }

/**
 * Internal schema declaration for Nonce type validation.
 * @internal
 */
const NonceTypeSchema = S.declare<NonceType>(
  (u): u is NonceType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Nonce' }
)

/**
 * Effect Schema for validating and parsing Ethereum account nonces.
 * Nonces must be non-negative integers and are used to order transactions
 * and prevent replay attacks.
 *
 * @param input - A bigint, number, or string representing the nonce
 * @returns The validated NonceType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NonceSchema } from 'voltaire-effect/Nonce'
 *
 * // Parse from bigint
 * const nonce = S.decodeSync(NonceSchema)(42n)
 *
 * // Parse from number
 * const fromNumber = S.decodeSync(NonceSchema)(0)
 *
 * // Parse from string
 * const fromString = S.decodeSync(NonceSchema)('100')
 * ```
 *
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
