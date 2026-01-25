import { StorageDiff } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type StorageDiffType = {
  readonly address: Uint8Array
  readonly changes: ReadonlyMap<any, any>
}

const StorageDiffTypeSchema = S.declare<StorageDiffType>(
  (u): u is StorageDiffType => 
    typeof u === 'object' && u !== null && 'address' in u && 'changes' in u,
  { identifier: 'StorageDiff' }
)

/**
 * Effect Schema for validating and parsing storage diffs.
 * A storage diff tracks changes to storage slots for a specific address.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageDiffSchema } from 'voltaire-effect/primitives/StorageDiff'
 *
 * const parse = S.decodeSync(StorageDiffSchema)
 * const diff = parse({
 *   address: new Uint8Array(20),
 *   changes: new Map()
 * })
 * ```
 *
 * @since 0.0.1
 */
export const StorageDiffSchema: S.Schema<StorageDiffType, { address: Uint8Array; changes: any }> = S.transformOrFail(
  S.Struct({
    address: S.Uint8ArrayFromSelf,
    changes: S.Any
  }),
  StorageDiffTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(StorageDiff.from(value.address as any, value.changes))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (diff) => ParseResult.succeed({ address: diff.address, changes: diff.changes })
  }
).annotations({ identifier: 'StorageDiffSchema' })
