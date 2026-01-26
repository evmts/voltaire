/**
 * @module Transaction
 * @description Effect Schemas for Ethereum transactions with support for all EIP-2718 types.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 *
 * function signTransaction(tx: Transaction.Any) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Transaction.Serialized` | Uint8Array (RLP) | Transaction |
 * | `Transaction.Rpc` | RPC object | Transaction |
 * | `Transaction.Schema` | struct fields | Transaction |
 * | `Transaction.LegacySchema` | struct fields | Legacy |
 * | `Transaction.EIP1559Schema` | struct fields | EIP1559 |
 * | `Transaction.EIP2930Schema` | struct fields | EIP2930 |
 * | `Transaction.EIP4844Schema` | struct fields | EIP4844 |
 * | `Transaction.EIP7702Schema` | struct fields | EIP7702 |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as S from 'effect/Schema'
 *
 * // Parse RLP-serialized bytes
 * const tx = S.decodeSync(Transaction.Serialized)(rawBytes)
 *
 * // Parse from RPC format
 * const tx2 = S.decodeSync(Transaction.Rpc)(rpcData)
 *
 * // Serialize to bytes
 * const bytes = S.encodeSync(Transaction.Serialized)(tx)
 *
 * // Convert to RPC format
 * const rpc = S.encodeSync(Transaction.Rpc)(tx)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Transaction.hash(tx)              // HashType
 * Transaction.signingHash(tx)       // HashType
 * Transaction.getSender(tx)         // AddressType
 * Transaction.getRecipient(tx)      // AddressType | null
 * Transaction.getChainId(tx)        // bigint | null
 * Transaction.getGasPrice(tx, base) // bigint
 * Transaction.isContractCreation(tx) // boolean
 * Transaction.isSigned(tx)          // boolean
 * Transaction.detectType(bytes)     // Type
 * ```
 *
 * @since 0.1.0
 */
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";

/**
 * Union type of all supported Ethereum transaction types.
 *
 * @description Discriminated union that includes Legacy, EIP-2930, EIP-1559,
 * EIP-4844, and EIP-7702 transactions. Use the `type` field to discriminate
 * between different transaction formats.
 *
 * @since 0.0.1
 */
export type Any = VoltaireTransaction.Any;

/**
 * Legacy (pre-EIP-2718) transaction type.
 *
 * @description Original Ethereum transaction format with gas price field.
 * Uses `v`, `r`, `s` signature fields and includes chain ID in the `v` value
 * for replay protection (EIP-155).
 *
 * @since 0.0.1
 */
export type Legacy = Extract<
	VoltaireTransaction.Any,
	{ type: VoltaireTransaction.Type.Legacy }
>;

/**
 * EIP-2930 access list transaction type.
 *
 * @since 0.0.1
 */
export type EIP2930 = Extract<
	VoltaireTransaction.Any,
	{ type: VoltaireTransaction.Type.EIP2930 }
>;

/**
 * EIP-1559 fee market transaction type.
 *
 * @since 0.0.1
 */
export type EIP1559 = Extract<
	VoltaireTransaction.Any,
	{ type: VoltaireTransaction.Type.EIP1559 }
>;

/**
 * EIP-4844 blob transaction type.
 *
 * @since 0.0.1
 */
export type EIP4844 = Extract<
	VoltaireTransaction.Any,
	{ type: VoltaireTransaction.Type.EIP4844 }
>;

/**
 * EIP-7702 set code transaction type.
 *
 * @since 0.0.1
 */
export type EIP7702 = Extract<
	VoltaireTransaction.Any,
	{ type: VoltaireTransaction.Type.EIP7702 }
>;

/**
 * Transaction type enum for discriminating between transaction formats.
 *
 * @since 0.0.1
 */
export const Type = VoltaireTransaction.Type;

export { Rpc, type RpcTransaction } from "./Rpc.js";
export { Serialized } from "./Serialized.js";
// Schemas
export {
	EIP1559Schema,
	EIP2930Schema,
	EIP4844Schema,
	EIP7702Schema,
	LegacySchema,
	Schema,
} from "./TransactionSchema.js";

// Pure functions

/**
 * Computes the Keccak-256 hash of a serialized transaction.
 *
 * @param tx - Transaction object to hash
 * @returns 32-byte transaction hash
 *
 * @since 0.1.0
 */
export const hash = (tx: Any): HashType => VoltaireTransaction.hash(tx);

/**
 * Computes the signing hash (digest) for a transaction.
 *
 * @param tx - Transaction object
 * @returns 32-byte signing hash
 *
 * @since 0.1.0
 */
export const signingHash = (tx: Any): HashType =>
	VoltaireTransaction.getSigningHash(tx);

/**
 * Recovers the sender address from the transaction signature.
 *
 * @param tx - Signed transaction object
 * @returns Recovered sender address
 *
 * @since 0.1.0
 */
export const getSender = (tx: Any): AddressType =>
	VoltaireTransaction.getSender(tx);

/**
 * Gets the recipient address from the transaction.
 *
 * @param tx - Transaction object
 * @returns Recipient address, or null for contract creation
 *
 * @since 0.1.0
 */
export const getRecipient = (tx: Any): AddressType | null =>
	VoltaireTransaction.getRecipient(tx);

/**
 * Gets the chain ID from the transaction.
 *
 * @param tx - Transaction object
 * @returns Chain ID, or null for legacy transactions without EIP-155
 *
 * @since 0.1.0
 */
export const getChainId = (tx: Any): bigint | null =>
	VoltaireTransaction.getChainId(tx);

/**
 * Gets the effective gas price for the transaction.
 *
 * @param tx - Transaction object
 * @param baseFee - Optional base fee for EIP-1559 calculations
 * @returns Effective gas price in wei
 *
 * @since 0.1.0
 */
export const getGasPrice = (tx: Any, baseFee?: bigint): bigint =>
	VoltaireTransaction.getGasPrice(tx, baseFee);

/**
 * Gets the nonce from the transaction.
 *
 * @param tx - Transaction object
 * @returns Transaction nonce
 *
 * @since 0.1.0
 */
export const getNonce = (tx: Any): bigint => tx.nonce;

/**
 * Gets the gas limit from the transaction.
 *
 * @param tx - Transaction object
 * @returns Gas limit
 *
 * @since 0.1.0
 */
export const getGasLimit = (tx: Any): bigint => tx.gasLimit;

/**
 * Gets the value from the transaction.
 *
 * @param tx - Transaction object
 * @returns Value in wei
 *
 * @since 0.1.0
 */
export const getValue = (tx: Any): bigint => tx.value;

/**
 * Gets the input data from the transaction.
 *
 * @param tx - Transaction object
 * @returns Transaction data bytes
 *
 * @since 0.1.0
 */
export const getData = (tx: Any): Uint8Array => tx.data;

/**
 * Checks if the transaction is a contract creation.
 *
 * @param tx - Transaction object
 * @returns true if contract creation (to is null)
 *
 * @since 0.1.0
 */
export const isContractCreation = (tx: Any): boolean =>
	VoltaireTransaction.isContractCreation(tx);

/**
 * Checks if the transaction has a valid signature.
 *
 * @param tx - Transaction object
 * @returns true if signed
 *
 * @since 0.1.0
 */
export const isSigned = (tx: Any): boolean => VoltaireTransaction.isSigned(tx);

/**
 * Detects the transaction type from serialized data.
 *
 * @param data - RLP-encoded transaction bytes
 * @returns Transaction type enum value
 *
 * @since 0.1.0
 */
export const detectType = (data: Uint8Array): VoltaireTransaction.Type =>
	VoltaireTransaction.detectType(data);
