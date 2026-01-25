/**
 * @fileoverview Effect-based module for Ethereum transaction handling.
 *
 * This module provides comprehensive support for all Ethereum transaction types
 * with type-safe Effect integration. It includes serialization, parsing, signing
 * hash computation, and Effect Schema validation.
 *
 * Supported transaction types:
 * - **Legacy** (type 0): Original Ethereum transaction format (pre-EIP-2718)
 * - **EIP-2930** (type 1): Access list transactions for gas optimization
 * - **EIP-1559** (type 2): Fee market transactions with base fee + priority fee
 * - **EIP-4844** (type 3): Blob transactions for rollup data availability
 * - **EIP-7702** (type 4): Set code transactions for account abstraction
 *
 * @module Transaction
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse a raw RLP-encoded transaction
 * const parsedTx = await Effect.runPromise(Transaction.parse(rawBytes))
 * console.log(parsedTx.type) // 0, 1, 2, 3, or 4
 *
 * // Serialize a transaction back to bytes
 * const bytes = await Effect.runPromise(Transaction.serialize(parsedTx))
 *
 * // Compute signing hash for signature creation
 * const hash = await Effect.runPromise(Transaction.signingHash(unsignedTx))
 *
 * // Use Effect Schema for validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Transaction.Schema)(rawTx)
 * ```
 *
 * @see {@link parse} - Parse RLP-encoded transaction bytes
 * @see {@link serialize} - Serialize transaction to bytes
 * @see {@link signingHash} - Compute transaction signing hash
 * @see {@link Schema} - Effect Schema for transaction validation
 */
import * as VoltaireTransaction from '@tevm/voltaire/Transaction'

/**
 * Union type of all supported Ethereum transaction types.
 *
 * @description Discriminated union that includes Legacy, EIP-2930, EIP-1559,
 * EIP-4844, and EIP-7702 transactions. Use the `type` field to discriminate
 * between different transaction formats.
 *
 * @example
 * ```typescript
 * function processTransaction(tx: Transaction.Any) {
 *   switch (tx.type) {
 *     case Transaction.Type.Legacy:
 *       console.log('Gas price:', tx.gasPrice)
 *       break
 *     case Transaction.Type.EIP1559:
 *       console.log('Max fee:', tx.maxFeePerGas)
 *       break
 *   }
 * }
 * ```
 *
 * @since 0.0.1
 */
export type Any = VoltaireTransaction.Any

/**
 * Legacy (pre-EIP-2718) transaction type.
 *
 * @description Original Ethereum transaction format with gas price field.
 * Uses `v`, `r`, `s` signature fields and includes chain ID in the `v` value
 * for replay protection (EIP-155).
 *
 * @since 0.0.1
 */
export type Legacy = Extract<VoltaireTransaction.Any, { type: VoltaireTransaction.Type.Legacy }>

/**
 * EIP-2930 access list transaction type.
 *
 * @description Transaction type 1 that includes an access list specifying
 * storage slots that will be accessed. Enables gas savings by pre-warming
 * storage slots.
 *
 * @since 0.0.1
 */
export type EIP2930 = Extract<VoltaireTransaction.Any, { type: VoltaireTransaction.Type.EIP2930 }>

/**
 * EIP-1559 fee market transaction type.
 *
 * @description Transaction type 2 with dynamic fee mechanism. Includes
 * `maxFeePerGas` and `maxPriorityFeePerGas` instead of a single gas price.
 * The most common transaction type on modern Ethereum.
 *
 * @since 0.0.1
 */
export type EIP1559 = Extract<VoltaireTransaction.Any, { type: VoltaireTransaction.Type.EIP1559 }>

/**
 * EIP-4844 blob transaction type.
 *
 * @description Transaction type 3 that carries blob data for Layer 2 rollups.
 * Includes `maxFeePerBlobGas` and `blobVersionedHashes` for proto-danksharding.
 *
 * @since 0.0.1
 */
export type EIP4844 = Extract<VoltaireTransaction.Any, { type: VoltaireTransaction.Type.EIP4844 }>

/**
 * EIP-7702 set code transaction type.
 *
 * @description Transaction type 4 for account abstraction. Allows EOAs to
 * temporarily set code via an authorization list. Enables smart account
 * features for regular externally-owned accounts.
 *
 * @since 0.0.1
 */
export type EIP7702 = Extract<VoltaireTransaction.Any, { type: VoltaireTransaction.Type.EIP7702 }>

/**
 * Transaction type enum for discriminating between transaction formats.
 *
 * @description Numeric enum values matching the EIP-2718 transaction type byte:
 * - `Legacy = 0` - Pre-EIP-2718 transactions
 * - `EIP2930 = 1` - Access list transactions
 * - `EIP1559 = 2` - Fee market transactions
 * - `EIP4844 = 3` - Blob transactions
 * - `EIP7702 = 4` - Set code transactions
 *
 * @example
 * ```typescript
 * if (tx.type === Transaction.Type.EIP1559) {
 *   console.log('EIP-1559 transaction')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const Type = VoltaireTransaction.Type

export { Schema, LegacySchema, EIP1559Schema, EIP2930Schema, EIP4844Schema, EIP7702Schema } from './TransactionSchema.js'
export { serialize } from './serialize.js'
export { signingHash } from './signingHash.js'
export { parse } from './parse.js'
export { deserialize } from './deserialize.js'
export { hash } from './hash.js'
export { getSender } from './getSender.js'
export { getRecipient } from './getRecipient.js'
export { getChainId } from './getChainId.js'
export { getGasPrice } from './getGasPrice.js'
export { getGasLimit } from './getGasLimit.js'
export { getNonce } from './getNonce.js'
export { getValue } from './getValue.js'
export { getData } from './getData.js'
export { isSigned } from './isSigned.js'
export { isContractCreation } from './isContractCreation.js'
export { detectType } from './detectType.js'
export { fromRpc, type RpcTransaction as RpcTransactionInput } from './fromRpc.js'
export { toRpc, type RpcTransaction as RpcTransactionOutput } from './toRpc.js'
