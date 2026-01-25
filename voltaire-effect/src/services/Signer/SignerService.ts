/**
 * @fileoverview Signer service definition for signing and transaction operations.
 *
 * @module SignerService
 * @since 0.0.1
 *
 * @description
 * The SignerService provides a high-level interface for wallet operations
 * including signing messages, signing transactions, and sending transactions.
 *
 * Unlike PublicClientService (read-only), SignerService requires an
 * AccountService for cryptographic signing operations.
 *
 * The service requires:
 * - AccountService - For signing (LocalAccount or JsonRpcAccount)
 * - PublicClientService - For gas estimation and nonce lookup
 * - TransportService - For broadcasting transactions
 *
 * @see {@link Signer} - The live implementation layer and composition helpers
 * @see {@link AccountService} - Required for signing operations
 * @see {@link PublicClientService} - For read operations
 */

import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
	TypedData,
} from "@tevm/voltaire";
import { AbstractError } from "@tevm/voltaire/errors";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;

/**
 * Error thrown when a signer operation fails.
 *
 * @description
 * Contains the original input, error message and optional underlying cause.
 * All SignerService methods may fail with this error type.
 *
 * Common failure reasons:
 * - User rejected the request (in browser wallet)
 * - Insufficient funds for transaction
 * - Invalid transaction parameters
 * - Network errors during broadcast
 * - Signing failures
 *
 * @since 0.0.1
 */
export class SignerError extends AbstractError {
	readonly _tag = "SignerError" as const;

	/**
	 * The original input that caused the error.
	 */
	readonly input: unknown;

	/**
	 * Creates a new SignerError.
	 *
	 * @param input - The original input that caused the error
	 * @param message - Human-readable error message
	 * @param options - Optional error options
	 * @param options.cause - Underlying error that caused this failure
	 */
	constructor(
		input: unknown,
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			cause?: Error;
		},
	) {
		super(message, options);
		this.name = "SignerError";
		this.input = input;
	}
}

/**
 * Transaction request for sending transactions.
 *
 * @description
 * Supports legacy, EIP-1559, and EIP-2930 transaction types.
 * Most fields are optional and will be auto-filled if not provided.
 *
 * Auto-filled fields:
 * - `nonce` - Fetched from network via getTransactionCount
 * - `gasLimit` - Estimated via estimateGas
 * - `gasPrice` or `maxFeePerGas` - Fetched from network
 * - `chainId` - Fetched from network via eth_chainId
 *
 * @since 0.0.1
 */
export type TransactionRequest = {
	/** Recipient address (null or undefined for contract deployment) */
	readonly to?: AddressType | null;
	/** Value in wei to send with the transaction */
	readonly value?: bigint;
	/** Transaction input data (for contract calls/deployment) */
	readonly data?: HexType;
	/** Transaction nonce (auto-filled from network if not provided) */
	readonly nonce?: bigint;
	/** Gas limit (auto-estimated if not provided) */
	readonly gasLimit?: bigint;
	/** Gas price for legacy transactions (type 0) */
	readonly gasPrice?: bigint;
	/** Max fee per gas for EIP-1559 transactions (type 2) */
	readonly maxFeePerGas?: bigint;
	/** Max priority fee (tip) for EIP-1559 transactions (type 2) */
	readonly maxPriorityFeePerGas?: bigint;
	/** Chain ID for replay protection (auto-detected if not provided) */
	readonly chainId?: bigint;
};

/**
 * Shape of the signer service.
 *
 * @description
 * Defines all signing and transaction operations available through SignerService.
 * Each method returns an Effect that may fail with SignerError.
 *
 * @since 0.0.1
 */
export type SignerShape = {
	/**
	 * Signs a message using EIP-191 personal_sign.
	 * @param message - The message to sign (hex-encoded)
	 * @returns Signature
	 */
	readonly signMessage: (
		message: HexType,
	) => Effect.Effect<SignatureType, SignerError>;

	/**
	 * Signs a transaction without broadcasting.
	 * @param tx - Transaction parameters
	 * @returns Signed transaction (hex-encoded)
	 */
	readonly signTransaction: (
		tx: TransactionRequest,
	) => Effect.Effect<HexType, SignerError>;

	/**
	 * Signs EIP-712 typed structured data.
	 * @param typedData - Typed data to sign
	 * @returns Signature
	 */
	readonly signTypedData: (
		typedData: TypedDataType,
	) => Effect.Effect<SignatureType, SignerError>;

	/**
	 * Signs and broadcasts a transaction.
	 * @param tx - Transaction parameters
	 * @returns Transaction hash
	 */
	readonly sendTransaction: (
		tx: TransactionRequest,
	) => Effect.Effect<HexType, SignerError>;

	/**
	 * Broadcasts an already-signed transaction.
	 * @param signedTx - RLP-encoded signed transaction
	 * @returns Transaction hash
	 */
	readonly sendRawTransaction: (
		signedTx: HexType,
	) => Effect.Effect<HexType, SignerError>;

	/**
	 * Requests wallet addresses (triggers wallet popup in browser).
	 * @returns Array of connected addresses
	 */
	readonly requestAddresses: () => Effect.Effect<AddressType[], SignerError>;

	/**
	 * Requests wallet to switch to a different chain.
	 * @param chainId - Target chain ID (e.g., 1 for mainnet)
	 */
	readonly switchChain: (chainId: number) => Effect.Effect<void, SignerError>;
};

/**
 * Signer service for signing and sending transactions.
 *
 * @description
 * Provides methods for signing messages, transactions, and typed data.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (Signer.Live layer) before running.
 *
 * The service provides:
 * - Message signing (signMessage - EIP-191)
 * - Transaction signing (signTransaction)
 * - Typed data signing (signTypedData - EIP-712)
 * - Transaction sending (sendTransaction, sendRawTransaction)
 * - Wallet interaction (requestAddresses, switchChain)
 *
 * Requires:
 * - AccountService - For cryptographic signing
 * - PublicClientService - For gas estimation and nonce
 * - TransportService - For transaction broadcast
 *
 * @since 0.0.1
 *
 * @see {@link Signer} - The live implementation layer and composition helpers
 * @see {@link SignerShape} - The service interface shape
 * @see {@link SignerError} - Error type for failed operations
 * @see {@link AccountService} - Required for signing
 */
export class SignerService extends Context.Tag("SignerService")<
	SignerService,
	SignerShape
>() {}
