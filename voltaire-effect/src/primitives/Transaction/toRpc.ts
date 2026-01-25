/**
 * @fileoverview Converts transaction to JSON-RPC format.
 *
 * @module Transaction/toRpc
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import type { Any } from './index.js'

/**
 * RPC transaction format for JSON-RPC responses.
 */
export type RpcTransaction = {
  type: string
  nonce: string
  gasLimit: string
  to: string | null
  value: string
  data: string
  r: string
  s: string
  v?: string
  yParity?: string
  chainId?: string
  gasPrice?: string
  maxPriorityFeePerGas?: string
  maxFeePerGas?: string
  maxFeePerBlobGas?: string
  accessList?: Array<{ address: string; storageKeys: string[] }>
  blobVersionedHashes?: string[]
  authorizationList?: Array<{
    chainId: string
    address: string
    nonce: string
    yParity: string
    r: string
    s: string
  }>
}

/**
 * Converts a transaction to JSON-RPC format.
 *
 * @param tx - Transaction object to convert
 * @returns Effect containing the RPC formatted transaction
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const rpc = Effect.runSync(Transaction.toRpc(tx))
 * // { type: '0x2', chainId: '0x1', nonce: '0x0', ... }
 * ```
 *
 * @since 0.0.1
 */
export const toRpc = (tx: Any): Effect.Effect<RpcTransaction> =>
  Effect.sync(() => VoltaireTransaction.toRpc(tx) as RpcTransaction)
