/**
 * @fileoverview Parses transaction from JSON-RPC format.
 *
 * @module Transaction/fromRpc
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'
import { InvalidLengthError, InvalidTransactionTypeError } from '@tevm/voltaire/errors'
import type { Any } from './index.js'

/**
 * RPC transaction format from JSON-RPC responses.
 */
export type RpcTransaction = {
  type?: string
  nonce?: string
  gasLimit?: string
  gas?: string
  to?: string | null
  value?: string
  data?: string
  input?: string
  r?: string
  s?: string
  v?: string
  yParity?: string
  chainId?: string
  gasPrice?: string
  maxPriorityFeePerGas?: string
  maxFeePerGas?: string
  maxFeePerBlobGas?: string
  accessList?: Array<{ address: string; storageKeys?: string[] }>
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
 * Parses a transaction from JSON-RPC format.
 *
 * @param rpc - JSON-RPC formatted transaction object
 * @returns Effect containing the parsed Transaction
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * const tx = await Effect.runPromise(Transaction.fromRpc({
 *   type: '0x2',
 *   chainId: '0x1',
 *   nonce: '0x0',
 *   maxPriorityFeePerGas: '0x3b9aca00',
 *   maxFeePerGas: '0x6fc23ac00',
 *   gasLimit: '0x5208',
 *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   value: '0xde0b6b3a7640000',
 *   data: '0x',
 *   accessList: [],
 * }))
 * ```
 *
 * @since 0.0.1
 */
export const fromRpc = (rpc: RpcTransaction): Effect.Effect<Any, InvalidLengthError | InvalidTransactionTypeError> =>
  Effect.try({
    try: () => VoltaireTransaction.fromRpc(rpc) as Any,
    catch: (e) => e as InvalidLengthError | InvalidTransactionTypeError,
  })
