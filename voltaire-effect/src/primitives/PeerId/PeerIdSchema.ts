import { PeerId } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a peer identifier in the P2P network.
 * @since 0.0.1
 */
type PeerIdType = ReturnType<typeof PeerId.from>

const PeerIdTypeSchema = S.declare<PeerIdType>(
  (u): u is PeerIdType => typeof u === 'string' && u.length > 0,
  { identifier: 'PeerId' }
)

/**
 * Effect Schema for validating and transforming peer identifiers.
 *
 * Transforms a string into a validated PeerId type for P2P networking.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PeerIdSchema } from 'voltaire-effect/primitives/PeerId'
 *
 * const peerId = S.decodeSync(PeerIdSchema)('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8...')
 * ```
 *
 * @since 0.0.1
 */
export const PeerIdSchema: S.Schema<PeerIdType, string> = S.transformOrFail(
  S.String,
  PeerIdTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(PeerId.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (peerId) => ParseResult.succeed(peerId as string)
  }
).annotations({ identifier: 'PeerIdSchema' })
