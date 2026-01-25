/**
 * TransactionHash module for handling 32-byte Ethereum transaction hashes.
 * 
 * Transaction hashes are the Keccak-256 hash of the RLP-encoded signed transaction.
 * They uniquely identify transactions on the blockchain.
 * 
 * @example
 * ```typescript
 * import * as TransactionHash from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const hash = await Effect.runPromise(TransactionHash.from('0x88df016...'))
 * const hex = TransactionHash.toHex(hash)
 * ```
 * 
 * @module TransactionHash
 * @since 0.0.1
 */
export { TransactionHashSchema, TransactionHashFromBytesSchema } from './TransactionHashSchema.js'
export { from, fromHex, fromBytes, toHex, TransactionHashError } from './from.js'
