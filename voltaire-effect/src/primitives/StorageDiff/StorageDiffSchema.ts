/**
 * @fileoverview Effect Schema definitions for EVM storage diffs.
 * Provides validation schemas for tracking storage slot changes.
 * @module StorageDiff/StorageDiffSchema
 * @since 0.0.1
 */

import { StorageDiff } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Represents storage slot changes for a specific account.
 *
 * @description
 * A StorageDiff tracks changes to storage slots for a single account address.
 * It maps slot keys to their before/after values, enabling efficient tracking
 * of state modifications during transaction execution.
 *
 * @example
 * ```typescript
 * import { StorageDiff } from 'voltaire-effect/primitives'
 *
 * // Storage diff for an account
 * const diff: StorageDiffType = {
 *   address: addressBytes,
 *   changes: new Map([
 *     [slot0, { from: oldValue, to: newValue }]
 *   ])
 * }
 * ```
 *
 * @since 0.0.1
 */
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
 * @description
 * This schema validates that a storage diff has the correct structure with
 * an address and a changes map. The changes map contains slot keys mapped
 * to their from/to values.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageDiffSchema } from 'voltaire-effect/primitives/StorageDiff'
 *
 * const parse = S.decodeSync(StorageDiffSchema)
 * const diff = parse({
 *   address: new Uint8Array(20),
 *   changes: new Map([
 *     [slot, { from: oldValue, to: newValue }]
 *   ])
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Validate storage diff structure
 * const validate = S.is(StorageDiffSchema)
 * const isValid = validate({
 *   address: new Uint8Array(20),
 *   changes: new Map()
 * })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
 *
 * @see {@link from} for Effect-based creation
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
