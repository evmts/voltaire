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
 * Transaction.getSigningHash(tx)    // HashType
 * Transaction.getSender(tx)         // AddressType
 * Transaction.getRecipient(tx)      // AddressType | null
 * Transaction.getChainId(tx)        // bigint | null
 * Transaction.getGasPrice(tx, base) // bigint
 * Transaction.isContractCreation(tx) // boolean
 * Transaction.isSigned(tx)          // boolean
 * Transaction.detectType(bytes)     // Type
 * ```
 *
 * ## Type Guards
 *
 * ```typescript
 * Transaction.isLegacy(tx)          // tx is Legacy
 * Transaction.isEIP1559(tx)         // tx is EIP1559
 * Transaction.isEIP2930(tx)         // tx is EIP2930
 * Transaction.isEIP4844(tx)         // tx is EIP4844
 * Transaction.isEIP7702(tx)         // tx is EIP7702
 * ```
 *
 * ## Effect-Returning Functions (Validation)
 *
 * ```typescript
 * Transaction.assertSigned(tx)      // Effect<void, UnsignedTransactionError>
 * Transaction.verifySignature(tx)   // Effect<boolean, InvalidSignatureError>
 * Transaction.validateChainId(tx)   // Effect<void, InvalidChainIdError>
 * Transaction.validateGasLimit(tx)  // Effect<void, InvalidGasLimitError>
 * Transaction.validateGasPrice(tx)  // Effect<void, InvalidGasPriceError>
 * Transaction.validateNonce(tx)     // Effect<void, InvalidNonceError>
 * Transaction.validateValue(tx)     // Effect<void, InvalidValueError>
 * ```
 *
 * ## Mutation (returns new transaction)
 *
 * ```typescript
 * Transaction.withNonce(tx, nonce)     // Any
 * Transaction.withGasLimit(tx, limit)  // Any
 * Transaction.withGasPrice(tx, price)  // Any
 * Transaction.withData(tx, data)       // Any
 * Transaction.replaceWith(tx, opts)    // Any
 * ```
 *
 * @since 0.1.0
 */
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as Effect from "effect/Effect";

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

// Re-export types from voltaire
export type {
	AccessList,
	AccessListItem,
	AuthorizationList,
	ReplaceOptions,
	VersionedHash,
} from "@tevm/voltaire/Transaction";

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
export const getSigningHash = (tx: Any): HashType =>
	VoltaireTransaction.getSigningHash(tx);

/**
 * @deprecated Use getSigningHash instead
 */
export const signingHash = getSigningHash;

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

/**
 * Checks if transaction is a contract call.
 *
 * @param tx - Transaction object
 * @returns true if to is set and data is non-empty
 *
 * @since 0.1.0
 */
export const isContractCall = (tx: Any): boolean =>
	VoltaireTransaction.isContractCall(tx);

/**
 * Checks if transaction has an access list.
 *
 * @param tx - Transaction object
 * @returns true if transaction type supports and has access list
 *
 * @since 0.1.0
 */
export const hasAccessList = (tx: Any): boolean =>
	VoltaireTransaction.hasAccessList(tx);

/**
 * Gets the access list from transaction.
 *
 * @param tx - Transaction object
 * @returns Access list (empty array for legacy transactions)
 *
 * @since 0.1.0
 */
export const getAccessList = (
	tx: Any,
): VoltaireTransaction.AccessList => VoltaireTransaction.getAccessList(tx);

/**
 * Gets blob count for EIP-4844 transactions.
 *
 * @param tx - EIP-4844 transaction
 * @returns Number of blobs
 *
 * @since 0.1.0
 */
export const getBlobCount = (tx: EIP4844): number =>
	VoltaireTransaction.getBlobCount(tx);

/**
 * Gets blob versioned hashes for EIP-4844 transactions.
 *
 * @param tx - EIP-4844 transaction
 * @returns Array of versioned hashes
 *
 * @since 0.1.0
 */
export const getBlobVersionedHashes = (
	tx: EIP4844,
): readonly VoltaireTransaction.VersionedHash[] =>
	VoltaireTransaction.getBlobVersionedHashes(tx);

/**
 * Gets authorization count for EIP-7702 transactions.
 *
 * @param tx - EIP-7702 transaction
 * @returns Number of authorizations
 *
 * @since 0.1.0
 */
export const getAuthorizationCount = (tx: EIP7702): number =>
	VoltaireTransaction.getAuthorizationCount(tx);

/**
 * Gets authorization list for EIP-7702 transactions.
 *
 * @param tx - EIP-7702 transaction
 * @returns Authorization list
 *
 * @since 0.1.0
 */
export const getAuthorizations = (
	tx: EIP7702,
): VoltaireTransaction.AuthorizationList =>
	VoltaireTransaction.getAuthorizations(tx);

// Type Guards

/**
 * Type guard for Legacy transactions.
 *
 * @param tx - Transaction object
 * @returns true if Legacy type
 *
 * @since 0.1.0
 */
export const isLegacy = (tx: Any): tx is Legacy =>
	VoltaireTransaction.isLegacy(tx);

/**
 * Type guard for EIP-2930 transactions.
 *
 * @param tx - Transaction object
 * @returns true if EIP-2930 type
 *
 * @since 0.1.0
 */
export const isEIP2930 = (tx: Any): tx is EIP2930 =>
	VoltaireTransaction.isEIP2930(tx);

/**
 * Type guard for EIP-1559 transactions.
 *
 * @param tx - Transaction object
 * @returns true if EIP-1559 type
 *
 * @since 0.1.0
 */
export const isEIP1559 = (tx: Any): tx is EIP1559 =>
	VoltaireTransaction.isEIP1559(tx);

/**
 * Type guard for EIP-4844 transactions.
 *
 * @param tx - Transaction object
 * @returns true if EIP-4844 type
 *
 * @since 0.1.0
 */
export const isEIP4844 = (tx: Any): tx is EIP4844 =>
	VoltaireTransaction.isEIP4844(tx);

/**
 * Type guard for EIP-7702 transactions.
 *
 * @param tx - Transaction object
 * @returns true if EIP-7702 type
 *
 * @since 0.1.0
 */
export const isEIP7702 = (tx: Any): tx is EIP7702 =>
	VoltaireTransaction.isEIP7702(tx);

// Mutation functions (return new transaction)

/**
 * Returns new transaction with updated nonce.
 *
 * @param tx - Transaction object
 * @param nonce - New nonce value
 * @returns New transaction with updated nonce
 *
 * @since 0.1.0
 */
export const withNonce = (tx: Any, nonce: bigint): Any =>
	VoltaireTransaction.withNonce(tx, nonce);

/**
 * Returns new transaction with updated gas limit.
 *
 * @param tx - Transaction object
 * @param gasLimit - New gas limit
 * @returns New transaction with updated gas limit
 *
 * @since 0.1.0
 */
export const withGasLimit = (tx: Any, gasLimit: bigint): Any =>
	VoltaireTransaction.withGasLimit(tx, gasLimit);

/**
 * Returns new transaction with updated gas price.
 *
 * @param tx - Transaction object
 * @param gasPrice - New gas price
 * @returns New transaction with updated gas price
 *
 * @since 0.1.0
 */
export const withGasPrice = (tx: Any, gasPrice: bigint): Any =>
	VoltaireTransaction.withGasPrice(tx, gasPrice);

/**
 * Returns new transaction with updated data.
 *
 * @param tx - Transaction object
 * @param data - New data
 * @returns New transaction with updated data
 *
 * @since 0.1.0
 */
export const withData = (tx: Any, data: Uint8Array): Any =>
	VoltaireTransaction.withData(tx, data);

/**
 * Returns new transaction with fee bump for replacement.
 *
 * @param tx - Transaction object
 * @param options - Replace options (fee bump percentage)
 * @returns New transaction suitable for replacement
 *
 * @since 0.1.0
 */
export const replaceWith = (
	tx: Any,
	options?: VoltaireTransaction.ReplaceOptions,
): Any => VoltaireTransaction.replaceWith(tx, options);

/**
 * Formats transaction to human-readable string.
 *
 * @param tx - Transaction object
 * @returns Formatted string representation
 *
 * @since 0.1.0
 */
export const format = (tx: Any): string => VoltaireTransaction.format(tx);

// Effect-returning functions (validation)

/**
 * Error thrown when transaction is not signed.
 *
 * @since 0.1.0
 */
export class UnsignedTransactionError extends Error {
	readonly _tag = "UnsignedTransactionError";
	constructor(message = "Transaction is not signed") {
		super(message);
		this.name = "UnsignedTransactionError";
	}
}

/**
 * Error thrown when signature verification fails.
 *
 * @since 0.1.0
 */
export class InvalidSignatureError extends Error {
	readonly _tag = "InvalidSignatureError";
	constructor(message = "Invalid signature") {
		super(message);
		this.name = "InvalidSignatureError";
	}
}

/**
 * Error thrown when chain ID validation fails.
 *
 * @since 0.1.0
 */
export class InvalidChainIdError extends Error {
	readonly _tag = "InvalidChainIdError";
	constructor(message = "Invalid chain ID") {
		super(message);
		this.name = "InvalidChainIdError";
	}
}

/**
 * Error thrown when gas limit validation fails.
 *
 * @since 0.1.0
 */
export class InvalidGasLimitError extends Error {
	readonly _tag = "InvalidGasLimitError";
	constructor(message = "Invalid gas limit") {
		super(message);
		this.name = "InvalidGasLimitError";
	}
}

/**
 * Error thrown when gas price validation fails.
 *
 * @since 0.1.0
 */
export class InvalidGasPriceError extends Error {
	readonly _tag = "InvalidGasPriceError";
	constructor(message = "Invalid gas price") {
		super(message);
		this.name = "InvalidGasPriceError";
	}
}

/**
 * Error thrown when nonce validation fails.
 *
 * @since 0.1.0
 */
export class InvalidNonceError extends Error {
	readonly _tag = "InvalidNonceError";
	constructor(message = "Invalid nonce") {
		super(message);
		this.name = "InvalidNonceError";
	}
}

/**
 * Error thrown when value validation fails.
 *
 * @since 0.1.0
 */
export class InvalidValueError extends Error {
	readonly _tag = "InvalidValueError";
	constructor(message = "Invalid value") {
		super(message);
		this.name = "InvalidValueError";
	}
}

/**
 * Asserts transaction is signed, returning Effect that fails if not.
 *
 * @param tx - Transaction object
 * @returns Effect that succeeds if signed, fails with UnsignedTransactionError otherwise
 *
 * @since 0.1.0
 */
export const assertSigned = (
	tx: Any,
): Effect.Effect<void, UnsignedTransactionError> =>
	Effect.try({
		try: () => VoltaireTransaction.assertSigned(tx),
		catch: (e) => new UnsignedTransactionError((e as Error).message),
	});

/**
 * Verifies transaction signature, returning Effect.
 *
 * @param tx - Transaction object
 * @returns Effect with boolean result or InvalidSignatureError
 *
 * @since 0.1.0
 */
export const verifySignature = (
	tx: Any,
): Effect.Effect<boolean, InvalidSignatureError> =>
	Effect.try({
		try: () => VoltaireTransaction.verifySignature(tx),
		catch: (e) => new InvalidSignatureError((e as Error).message),
	});

/**
 * Validates chain ID, returning Effect that fails if invalid.
 *
 * @param tx - Transaction object
 * @returns Effect that succeeds if valid, fails with InvalidChainIdError otherwise
 *
 * @since 0.1.0
 */
export const validateChainId = (
	tx: Any,
): Effect.Effect<void, InvalidChainIdError> =>
	Effect.try({
		try: () => VoltaireTransaction.validateChainId(tx),
		catch: (e) => new InvalidChainIdError((e as Error).message),
	});

/**
 * Validates gas limit, returning Effect that fails if invalid.
 *
 * @param tx - Transaction object
 * @returns Effect that succeeds if valid, fails with InvalidGasLimitError otherwise
 *
 * @since 0.1.0
 */
export const validateGasLimit = (
	tx: Any,
): Effect.Effect<void, InvalidGasLimitError> =>
	Effect.try({
		try: () => VoltaireTransaction.validateGasLimit(tx),
		catch: (e) => new InvalidGasLimitError((e as Error).message),
	});

/**
 * Validates gas price, returning Effect that fails if invalid.
 *
 * @param tx - Transaction object
 * @returns Effect that succeeds if valid, fails with InvalidGasPriceError otherwise
 *
 * @since 0.1.0
 */
export const validateGasPrice = (
	tx: Any,
): Effect.Effect<void, InvalidGasPriceError> =>
	Effect.try({
		try: () => VoltaireTransaction.validateGasPrice(tx),
		catch: (e) => new InvalidGasPriceError((e as Error).message),
	});

/**
 * Validates nonce, returning Effect that fails if invalid.
 *
 * @param tx - Transaction object
 * @returns Effect that succeeds if valid, fails with InvalidNonceError otherwise
 *
 * @since 0.1.0
 */
export const validateNonce = (
	tx: Any,
): Effect.Effect<void, InvalidNonceError> =>
	Effect.try({
		try: () => VoltaireTransaction.validateNonce(tx),
		catch: (e) => new InvalidNonceError((e as Error).message),
	});

/**
 * Validates value, returning Effect that fails if invalid.
 *
 * @param tx - Transaction object
 * @returns Effect that succeeds if valid, fails with InvalidValueError otherwise
 *
 * @since 0.1.0
 */
export const validateValue = (
	tx: Any,
): Effect.Effect<void, InvalidValueError> =>
	Effect.try({
		try: () => VoltaireTransaction.validateValue(tx),
		catch: (e) => new InvalidValueError((e as Error).message),
	});
