import { State } from '@tevm/voltaire'
import * as S from 'effect/Schema'

/**
 * Branded type representing a storage key (address + slot combination).
 * Used to identify a specific storage location in an Ethereum account.
 *
 * @since 0.0.1
 */
export type StorageKeyType = State.StorageKeyType

/**
 * Union type for values that can be converted to a StorageKey.
 *
 * @since 0.0.1
 */
export type StorageKeyLike = State.StorageKeyLike

/**
 * Effect Schema for validating storage key structure.
 * A storage key consists of an address and a slot number.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageKeySchema } from 'voltaire-effect/primitives/State'
 *
 * const validate = S.is(StorageKeySchema)
 * const isValid = validate({
 *   address: new Uint8Array(20),
 *   slot: 0n
 * })
 * ```
 *
 * @since 0.0.1
 */
export const StorageKeySchema = S.Struct({
  address: S.Uint8ArrayFromSelf,
  slot: S.BigIntFromSelf,
}).annotations({ identifier: 'StorageKey' })

/**
 * Effect Schema for validating storage keys.
 * Alias for StorageKeySchema.
 *
 * @since 0.0.1
 */
export const Schema = StorageKeySchema
