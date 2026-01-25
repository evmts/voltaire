import { TransactionHash } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type for 32-byte transaction hashes.
 * @since 0.0.1
 */
type TransactionHashType = Uint8Array & { readonly __tag: 'TransactionHash' }

/**
 * Internal schema declaration for TransactionHash type validation.
 * @since 0.0.1
 */
const TransactionHashTypeSchema = S.declare<TransactionHashType>(
  (u): u is TransactionHashType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'TransactionHash' }
)

/**
 * Effect Schema for validating and transforming transaction hashes from hex strings.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { TransactionHashSchema } from './TransactionHashSchema.js'
 * 
 * const hash = Schema.decodeSync(TransactionHashSchema)(
 *   '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
 * )
 * ```
 * 
 * @since 0.0.1
 */
export const TransactionHashSchema: S.Schema<TransactionHashType, string> = S.transformOrFail(
  S.String,
  TransactionHashTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(TransactionHash.from(s) as unknown as TransactionHashType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (hash) => ParseResult.succeed(TransactionHash.toHex(hash as any))
  }
).annotations({ identifier: 'TransactionHashSchema' })

/**
 * Effect Schema for validating and transforming transaction hashes from bytes.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { TransactionHashFromBytesSchema } from './TransactionHashSchema.js'
 * 
 * const hash = Schema.decodeSync(TransactionHashFromBytesSchema)(bytes32)
 * ```
 * 
 * @since 0.0.1
 */
export const TransactionHashFromBytesSchema: S.Schema<TransactionHashType, Uint8Array> = S.transformOrFail(
  S.Uint8ArrayFromSelf,
  TransactionHashTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(TransactionHash.from(bytes) as unknown as TransactionHashType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (hash) => ParseResult.succeed(hash as Uint8Array)
  }
).annotations({ identifier: 'TransactionHashFromBytesSchema' })
