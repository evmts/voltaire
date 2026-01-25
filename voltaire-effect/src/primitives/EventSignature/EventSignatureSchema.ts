import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { EventSignature } from '@tevm/voltaire'

/**
 * Type representing a 32-byte event topic (keccak256 of event signature).
 * @since 0.0.1
 */
export type EventSignatureType = ReturnType<typeof EventSignature.from>

/**
 * Input types accepted for creating an EventSignature.
 * @since 0.0.1
 */
export type EventSignatureLike = Parameters<typeof EventSignature.from>[0]

const EventSignatureTypeSchema = S.declare<EventSignatureType>(
  (u): u is EventSignatureType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'EventSignature' }
)

/**
 * Effect Schema for validating event topic selectors.
 * Accepts hex strings or Uint8Array and returns branded EventSignatureType.
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/EventSignature'
 * import * as Schema from 'effect/Schema'
 *
 * const sig = Schema.decodeSync(EventSignature.EventSignatureSchema)(transferTopic)
 * ```
 * @since 0.0.1
 */
export const EventSignatureSchema: S.Schema<EventSignatureType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  EventSignatureTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(EventSignature.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (sig) => ParseResult.succeed(EventSignature.toHex(sig))
  }
).annotations({ identifier: 'EventSignatureSchema' })
