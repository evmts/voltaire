import { Storage } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type StorageSlotType = Uint8Array & { readonly __tag: 'StorageSlot' }

const StorageSlotTypeSchema = S.declare<StorageSlotType>(
  (u): u is StorageSlotType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'StorageSlot' }
)

/**
 * Effect Schema for validating and parsing storage slot values.
 * Storage slots are 32-byte values that can be created from various inputs.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageSlotSchema } from 'voltaire-effect/primitives/Storage'
 *
 * const parse = S.decodeSync(StorageSlotSchema)
 * const slot = parse(0n)
 * const slotFromHex = parse('0x0000...0001')
 * ```
 *
 * @since 0.0.1
 */
export const StorageSlotSchema: S.Schema<StorageSlotType, bigint | number | string | Uint8Array> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String, S.Uint8ArrayFromSelf),
  StorageSlotTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Storage.from(value as bigint | number | string | Uint8Array) as unknown as StorageSlotType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (slot) => ParseResult.succeed(slot as Uint8Array)
  }
).annotations({ identifier: 'StorageSlotSchema' })
