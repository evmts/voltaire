import type { Hash } from "./hash"

export const transactionSymbol = Symbol("Transaction")

/**
 * Transaction type enum matching Zig TransactionType
 */
export enum TransactionType {
	Legacy = 0x00,
	EIP2930 = 0x01,
	EIP1559 = 0x02,
	EIP4844 = 0x03,
	EIP7702 = 0x04,
}

/**
 * Ethereum address (20 bytes)
 */
export interface Address {
	bytes: Uint8Array
}

/**
 * Access list item for EIP-2930 and later transactions
 */
export interface AccessListItem {
	address: Address
	storageKeys: Hash[]
}

/**
 * Authorization for EIP-7702 transactions
 */
export interface Authorization {
	chainId: bigint
	address: Address
	nonce: bigint
	yParity: number
	r: Uint8Array
	s: Uint8Array
}

/**
 * Versioned hash for EIP-4844 blob transactions
 */
export type VersionedHash = Hash

/**
 * Legacy transaction (Type 0)
 * Original Ethereum transaction format with fixed gas price
 */
export interface LegacyTransaction {
	type: TransactionType.Legacy
	nonce: bigint
	gasPrice: bigint
	gasLimit: bigint
	to: Address | null
	value: bigint
	data: Uint8Array
	v: bigint
	r: Uint8Array
	s: Uint8Array
}

/**
 * EIP-2930 transaction (Type 1)
 * Adds access list and explicit chain ID for replay protection
 */
export interface Eip2930Transaction {
	type: TransactionType.EIP2930
	chainId: bigint
	nonce: bigint
	gasPrice: bigint
	gasLimit: bigint
	to: Address | null
	value: bigint
	data: Uint8Array
	accessList: AccessListItem[]
	yParity: number
	r: Uint8Array
	s: Uint8Array
}

/**
 * EIP-1559 transaction (Type 2)
 * Dynamic fee market with priority fee and max fee per gas
 */
export interface Eip1559Transaction {
	type: TransactionType.EIP1559
	chainId: bigint
	nonce: bigint
	maxPriorityFeePerGas: bigint
	maxFeePerGas: bigint
	gasLimit: bigint
	to: Address | null
	value: bigint
	data: Uint8Array
	accessList: AccessListItem[]
	yParity: number
	r: Uint8Array
	s: Uint8Array
}

/**
 * EIP-4844 blob transaction (Type 3)
 * Adds blob data support for layer 2 scaling with separate blob gas market
 */
export interface Eip4844Transaction {
	type: TransactionType.EIP4844
	chainId: bigint
	nonce: bigint
	maxPriorityFeePerGas: bigint
	maxFeePerGas: bigint
	gasLimit: bigint
	to: Address
	value: bigint
	data: Uint8Array
	accessList: AccessListItem[]
	maxFeePerBlobGas: bigint
	blobVersionedHashes: VersionedHash[]
	yParity: number
	r: Uint8Array
	s: Uint8Array
}

/**
 * EIP-7702 transaction (Type 4)
 * EOA delegation to smart contracts with authorization list
 */
export interface Eip7702Transaction {
	type: TransactionType.EIP7702
	chainId: bigint
	nonce: bigint
	maxPriorityFeePerGas: bigint
	maxFeePerGas: bigint
	gasLimit: bigint
	to: Address | null
	value: bigint
	data: Uint8Array
	accessList: AccessListItem[]
	authorizationList: Authorization[]
	yParity: number
	r: Uint8Array
	s: Uint8Array
}

/**
 * Union type for all transaction types
 */
export type Transaction =
	| LegacyTransaction
	| Eip2930Transaction
	| Eip1559Transaction
	| Eip4844Transaction
	| Eip7702Transaction

export class NotImplementedError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "NotImplementedError"
	}
}

/**
 * Detect transaction type from encoded data
 *
 * @param data RLP encoded transaction data
 * @returns Transaction type
 * @throws Error if invalid transaction type
 */
export function detectType(data: Uint8Array): TransactionType {
	throw new NotImplementedError("Transaction.detectType not yet implemented")
}

/**
 * Serialize transaction to RLP encoded bytes
 *
 * @param tx Transaction of any type
 * @returns RLP encoded transaction
 */
export function serialize(tx: Transaction): Uint8Array {
	throw new NotImplementedError("Transaction.serialize not yet implemented")
}

/**
 * Compute transaction hash (keccak256 of serialized transaction)
 *
 * @param tx Transaction of any type
 * @returns 32-byte transaction hash
 */
export function hash(tx: Transaction): Hash {
	throw new NotImplementedError("Transaction.hash not yet implemented")
}

/**
 * Type guard: Check if value is LegacyTransaction
 */
export function isLegacyTransaction(
	tx: Transaction,
): tx is LegacyTransaction {
	return tx.type === TransactionType.Legacy
}

/**
 * Type guard: Check if value is Eip2930Transaction
 */
export function isEip2930Transaction(
	tx: Transaction,
): tx is Eip2930Transaction {
	return tx.type === TransactionType.EIP2930
}

/**
 * Type guard: Check if value is Eip1559Transaction
 */
export function isEip1559Transaction(
	tx: Transaction,
): tx is Eip1559Transaction {
	return tx.type === TransactionType.EIP1559
}

/**
 * Type guard: Check if value is Eip4844Transaction
 */
export function isEip4844Transaction(
	tx: Transaction,
): tx is Eip4844Transaction {
	return tx.type === TransactionType.EIP4844
}

/**
 * Type guard: Check if value is Eip7702Transaction
 */
export function isEip7702Transaction(
	tx: Transaction,
): tx is Eip7702Transaction {
	return tx.type === TransactionType.EIP7702
}
