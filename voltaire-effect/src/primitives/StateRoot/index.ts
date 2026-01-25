import type { Bytes32Type } from '@tevm/voltaire/Bytes'

export { StateRootSchema, type StateRootType } from './StateRootSchema.js'
export { from, empty } from './from.js'

export type StateRootLike = StateRootType | string | Uint8Array | bigint | number
type StateRootType = Bytes32Type & { readonly __tag: 'StateRoot' }
