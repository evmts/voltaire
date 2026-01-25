import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { DomainSeparator } from '@tevm/voltaire'

/**
 * Type representing an EIP-712 domain separator (32-byte hash).
 * @since 0.0.1
 */
export type DomainSeparatorType = ReturnType<typeof DomainSeparator.from>

const DomainSeparatorTypeSchema = S.declare<DomainSeparatorType>(
  (u): u is DomainSeparatorType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'DomainSeparator' }
)

/**
 * Effect Schema for validating EIP-712 domain separators.
 * Accepts hex strings or Uint8Array and returns branded DomainSeparatorType.
 *
 * @example
 * ```typescript
 * import * as DomainSeparator from 'voltaire-effect/DomainSeparator'
 * import * as Schema from 'effect/Schema'
 *
 * const separator = Schema.decodeSync(DomainSeparator.DomainSeparatorSchema)('0x...')
 * ```
 * @since 0.0.1
 */
export const DomainSeparatorSchema: S.Schema<DomainSeparatorType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  DomainSeparatorTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(DomainSeparator.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (separator) => ParseResult.succeed(DomainSeparator.toHex(separator))
  }
).annotations({ identifier: 'DomainSeparatorSchema' })

/**
 * Effect Schema for creating domain separator from bytes only.
 *
 * @example
 * ```typescript
 * import * as DomainSeparator from 'voltaire-effect/DomainSeparator'
 * import * as Schema from 'effect/Schema'
 *
 * const separator = Schema.decodeSync(DomainSeparator.DomainSeparatorFromBytesSchema)(bytes)
 * ```
 * @since 0.0.1
 */
export const DomainSeparatorFromBytesSchema: S.Schema<DomainSeparatorType, Uint8Array> = S.transformOrFail(
  S.Uint8ArrayFromSelf,
  DomainSeparatorTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(DomainSeparator.fromBytes(bytes))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (separator) => ParseResult.succeed(separator)
  }
).annotations({ identifier: 'DomainSeparatorFromBytesSchema' })
