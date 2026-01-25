import { Metadata } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * The Metadata type representing contract metadata (CBOR-encoded at end of bytecode).
 * @since 0.0.1
 */
type MetadataType = ReturnType<typeof Metadata.from>

/**
 * Internal schema declaration for Metadata type validation.
 * @internal
 */
const MetadataTypeSchema = S.declare<MetadataType>(
  (u): u is MetadataType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as Record<string, unknown>
    return obj.raw instanceof Uint8Array
  },
  { identifier: 'Metadata' }
)

/**
 * Effect Schema for validating and parsing contract metadata.
 * Contract metadata is CBOR-encoded data appended to the end of contract bytecode,
 * containing information like compiler version, source hash, etc.
 *
 * @param input - A Uint8Array containing the raw metadata bytes
 * @returns The validated MetadataType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { MetadataSchema } from 'voltaire-effect/Metadata'
 *
 * // Parse metadata from bytecode
 * const metadataBytes = new Uint8Array([0xa2, 0x64, 0x69, 0x70, 0x66, 0x73])
 * const metadata = S.decodeSync(MetadataSchema)(metadataBytes)
 * ```
 *
 * @since 0.0.1
 */
export const MetadataSchema: S.Schema<MetadataType, Uint8Array> = S.transformOrFail(
  S.Uint8ArrayFromSelf,
  MetadataTypeSchema,
  {
    strict: true,
    decode: (raw, _options, ast) => {
      try {
        return ParseResult.succeed(Metadata.from(raw))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, raw, (e as Error).message))
      }
    },
    encode: (metadata) => ParseResult.succeed(metadata.raw)
  }
).annotations({ identifier: 'MetadataSchema' })
