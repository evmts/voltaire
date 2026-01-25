import { BeaconBlockRoot } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BeaconBlockRootType = BeaconBlockRoot.BeaconBlockRootType

const BeaconBlockRootTypeSchema = Schema.declare<BeaconBlockRootType>(
  (u): u is BeaconBlockRootType => {
    if (!(u instanceof Uint8Array)) return false
    try {
      BeaconBlockRoot.toHex(u as BeaconBlockRootType)
      return true
    } catch {
      return false
    }
  },
  { identifier: 'BeaconBlockRoot' }
)

/**
 * Effect Schema for validating and parsing beacon block roots.
 * Decodes hex strings to 32-byte BeaconBlockRootType.
 * 
 * @example
 * ```typescript
 * import { BeaconBlockRootSchema } from 'voltaire-effect/primitives/BeaconBlockRoot'
 * import * as Schema from 'effect/Schema'
 * 
 * const root = Schema.decodeSync(BeaconBlockRootSchema)('0x...')
 * ```
 * 
 * @since 0.0.1
 */
export const BeaconBlockRootSchema: Schema.Schema<BeaconBlockRootType, string> = Schema.transformOrFail(
  Schema.String,
  BeaconBlockRootTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(BeaconBlockRoot.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (h) => ParseResult.succeed(BeaconBlockRoot.toHex(h))
  }
).annotations({ identifier: 'BeaconBlockRootSchema' })
