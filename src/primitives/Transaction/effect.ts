import * as Schema from 'effect/Schema'
import * as Brand from 'effect/Brand'

import { fromRpc as _fromRpc } from './fromRpc.js'
import { toRpc as _toRpc } from './toRpc.js'
import { serialize as _serialize_internal } from './serialize.js'
import { deserialize as _deserialize } from './deserialize.js'
import { hash as _hash_internal } from './hash.js'
import { getSigningHash as _getSigningHash_internal } from './getSigningHash.js'
import { getSender as _getSender_internal } from './getSender.js'
import { verifySignature as _verifySignature_internal } from './verifySignature.js'
import { format as _format_internal } from './format.js'
import { getGasPrice as _getGasPrice_internal } from './getGasPrice.js'
import { hasAccessList as _hasAccessList_internal } from './hasAccessList.js'
import { getAccessList as _getAccessList_internal } from './getAccessList.js'
import { getChainId as _getChainId_internal } from './getChainId.js'
import { isSigned as _isSigned_internal } from './isSigned.js'
import { detectType as _detectType } from './typeGuards.js'
import { Type } from './types.js'

export type TransactionBrand = unknown & Brand.Brand<'Transaction'>

export const TransactionBrand = Brand.nominal<TransactionBrand>()

// Minimal structural check: object with numeric type matching Type enum
const isTransactionLike = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && typeof (v as any).type === 'number' && (v as any).type in Type

export class TransactionSchema extends Schema.Class<TransactionSchema>('Transaction')({
  value: Schema.Unknown.pipe(
    Schema.filter(isTransactionLike, { message: () => 'Invalid transaction structure' })
  )
}) {
  get tx(): any { return this.value }
  get branded(): TransactionBrand { return this.tx as TransactionBrand }

  static fromBranded(brand: TransactionBrand): TransactionSchema {
    return new TransactionSchema({ value: brand as any })
  }

  static fromRpc(rpc: any): TransactionSchema {
    const tx = _fromRpc(rpc)
    return new TransactionSchema({ value: tx })
  }

  static deserialize(bytes: Uint8Array): TransactionSchema {
    const tx = _deserialize(bytes)
    return new TransactionSchema({ value: tx })
  }

  toRpc(): any { return _toRpc(this.tx) }
  serialize(): Uint8Array { return _serialize_internal.call(this.tx) }
  hash(): Uint8Array { return _hash_internal.call(this.tx) as any }
  getSigningHash(): Uint8Array { return _getSigningHash_internal.call(this.tx) as any }
  getSender(): Uint8Array { return _getSender_internal.call(this.tx) as any }
  verifySignature(): boolean { return _verifySignature_internal.call(this.tx) }
  format(): string { return _format_internal.call(this.tx) }
  getGasPrice(baseFee?: bigint): bigint { return _getGasPrice_internal.call(this.tx, baseFee) }
  hasAccessList(): boolean { return _hasAccessList_internal.call(this.tx) }
  getAccessList(): any { return _getAccessList_internal.call(this.tx) }
  getChainId(): bigint | null { return _getChainId_internal.call(this.tx) }
  isSigned(): boolean { return _isSigned_internal.call(this.tx) }
  static detectType(bytes: Uint8Array): number { return _detectType(bytes) }
}

