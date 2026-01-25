import type { Bytes32Type } from '@tevm/voltaire/Bytes'

export { StorageValueSchema, type StorageValueType } from './StorageValueSchema.js'
export { from, zero, fromBigInt } from './from.js'

export type StorageValueLike = StorageValueType | string | Uint8Array | bigint | number
type StorageValueType = Bytes32Type & { readonly __tag: 'StorageValue' }
