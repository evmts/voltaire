/**
 * @fileoverview Account service definition for cryptographic signing operations.
 *
 * @module AccountService
 * @since 0.0.1
 *
 * @description
 * The AccountService provides a unified interface for cryptographic signing
 * operations regardless of the underlying implementation (local private key,
 * JSON-RPC provider, hardware wallet).
 *
 * Implementations:
 * - {@link LocalAccount} - Signs locally with a private key
 * - {@link JsonRpcAccount} - Delegates signing to a JSON-RPC provider
 *
 * The service is used by SignerService for transaction signing.
 *
 * @see {@link LocalAccount} - Local private key implementation
 * @see {@link JsonRpcAccount} - Remote JSON-RPC implementation
 * @see {@link SignerService} - Uses AccountService for signing
 */

import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
	TypedData,
} from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;
type AddressInput = AddressType | `0x${string}`;

/**
 * Unsigned EIP-7702 authorization tuple ready for signing.
 *
 * @description
 * An authorization allows an EOA to delegate code execution to a contract.
 * This represents the data that will be signed per the EIP-7702 specification.
 *
 * The signed authorization can be included in a type 4 (EIP-7702) transaction's
 * authorizationList to enable smart account functionality for the signer's EOA.
 *
 * @since 0.0.1
 */
export type UnsignedAuthorization = {
	/** Chain ID where the authorization is valid */
	readonly chainId: bigint;
	/** Address of the contract to delegate to */
	readonly address: AddressInput;
	/** Nonce of the authorizing account */
	readonly nonce: bigint;
};

/**
 * Signed EIP-7702 authorization tuple.
 *
 * @description
 * Contains the original authorization data plus the ECDSA signature components.
 * This can be included in a type 4 transaction's authorizationList.
 *
 * @since 0.0.1
 */
export type SignedAuthorization = {
	/** Chain ID where the authorization is valid */
	readonly chainId: bigint;
	/** Address of the contract to delegate to (hex string) */
	readonly address: `0x${string}`;
	/** Nonce of the authorizing account */
	readonly nonce: bigint;
	/** Signature Y parity (0 or 1) */
	readonly yParity: number;
	/** Signature r component (hex string) */
	readonly r: `0x${string}`;
	/** Signature s component (hex string) */
	readonly s: `0x${string}`;
};

/**
 * Error thrown when an account operation fails.
 *
 * @description
 * Contains the original input, error message and optional underlying cause.
 * All AccountService methods may fail with this error type.
 *
 * Common failure reasons:
 * - Invalid private key
 * - Signing operation failed
 * - User rejected (for hardware/remote wallets)
 * - Invalid message/transaction format
 *
 * @since 0.0.1
 *
 * @example Creating an AccountError
 * ```typescript
 * const error = new AccountError({
 *   input: { action: 'signMessage', message: '0x1234' },
 *   message: 'Failed to sign message',
 *   cause: originalError
 * })
 *
 * console.log(error.input)   // { action: 'signMessage', message: '0x1234' }
 * console.log(error.message) // 'Failed to sign message'
 * console.log(error.cause)   // originalError
 * ```
 *
 * @example Handling AccountError in Effect
 * ```typescript
 * import { Effect } from 'effect'
 * import { AccountService, AccountError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   return yield* account.signMessage(messageHex)
 * }).pipe(
 *   Effect.catchTag('AccountError', (error) => {
 *     console.error('Signing failed:', error.message)
 *     return Effect.fail(error)
 *   })
 * )
 * ```
 */
export class AccountError extends Data.TaggedError("AccountError")<{
	/**
	 * The original input that caused the error.
	 */
	readonly input: unknown;

	/**
	 * Human-readable error message.
	 */
	readonly message: string;

	/**
	 * JSON-RPC error code (if applicable).
	 */
	readonly code?: number;

	/**
	 * Optional underlying cause.
	 */
	readonly cause?: unknown;

	/**
	 * Optional context for debugging.
	 */
	readonly context?: Record<string, unknown>;
}> {
	/**
	 * Creates a new AccountError.
	 *
	 * @param input - The original input that caused the error
	 * @param message - Human-readable error message (optional, defaults to cause message)
	 * @param options - Optional error options
	 * @param options.code - JSON-RPC error code
	 * @param options.cause - Underlying error that caused this failure
	 */
	constructor(
		input: unknown,
		message?: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			cause?: Error;
		},
	) {
		super({
			input,
			message: message ?? options?.cause?.message ?? "Account error",
			code: options?.code,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Unsigned transaction ready for signing.
 *
 * @description
 * All required fields must be populated before signing.
 * This is different from TransactionRequest which has optional fields
 * that are auto-filled by SignerService.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const tx: UnsignedTransaction = {
 *   to: recipientAddress,
 *   value: 1000000000000000000n,
 *   nonce: 5n,
 *   gasLimit: 21000n,
 *   gasPrice: 20000000000n,
 *   chainId: 1n
 * }
 * ```
 */
export type UnsignedTransaction = {
	/** Recipient address (null/undefined for contract deployment) */
	readonly to?: AddressInput | null;
	/** Value in wei to send */
	readonly value?: bigint;
	/** Transaction input data */
	readonly data?: HexType;
	/** Transaction nonce (required) */
	readonly nonce: bigint;
	/** Gas limit (required) */
	readonly gasLimit: bigint;
	/** Gas price for legacy/EIP-2930 transactions (type 0/1) */
	readonly gasPrice?: bigint;
	/** Max fee per gas for EIP-1559+ transactions (type 2/3/4) */
	readonly maxFeePerGas?: bigint;
	/** Max priority fee for EIP-1559+ transactions (type 2/3/4) */
	readonly maxPriorityFeePerGas?: bigint;
	/** Chain ID for replay protection (required) */
	readonly chainId: bigint;
	/** EIP-2930+ access list */
	readonly accessList?: readonly {
		address: AddressInput;
		storageKeys: readonly `0x${string}`[];
	}[];
	/** Transaction type (auto-detected if not provided) */
	readonly type?: 0 | 1 | 2 | 3 | 4;
	/** EIP-4844: Versioned hashes for blob commitments */
	readonly blobVersionedHashes?: readonly `0x${string}`[];
	/** EIP-4844: Max fee per blob gas */
	readonly maxFeePerBlobGas?: bigint;
	/** EIP-4844: Raw blob data (sidecar) */
	readonly blobs?: readonly Uint8Array[];
	/** EIP-4844: KZG commitments for blobs (sidecar) */
	readonly kzgCommitments?: readonly `0x${string}`[];
	/** EIP-4844: KZG proofs for blobs (sidecar) */
	readonly kzgProofs?: readonly `0x${string}`[];
	/** EIP-7702: Authorization list for set code transactions */
	readonly authorizationList?: readonly {
		chainId: bigint;
		address: `0x${string}`;
		nonce: bigint;
		yParity?: number;
		v?: number;
		r: `0x${string}`;
		s: `0x${string}`;
	}[];
};

/**
 * Shape of an account service.
 *
 * @description
 * Defines the signing capabilities of an account.
 * All account implementations (LocalAccount, JsonRpcAccount) must
 * provide these methods.
 *
 * @since 0.0.1
 */
export type AccountShape = {
	/** The account's Ethereum address */
	readonly address: AddressType;

	/** The type of account (local, json-rpc, or hardware) */
	readonly type: "local" | "json-rpc" | "hardware";

	/**
	 * The account's public key (65 bytes uncompressed).
	 * Only available for local accounts. Returns undefined for json-rpc/hardware.
	 */
	readonly publicKey: Uint8Array | undefined;

	/**
	 * Signs a message using EIP-191 personal_sign.
	 * @param message - The message to sign (hex-encoded)
	 * @returns Signature
	 */
	readonly signMessage: (
		message: HexType,
	) => Effect.Effect<SignatureType, AccountError>;

	/**
	 * Signs a raw 32-byte hash directly without any prefix.
	 * Use this for signing pre-computed hashes (e.g., EIP-712 hashes).
	 * @param params - Object containing the hash to sign
	 * @param params.hash - The 32-byte hash as hex
	 * @returns Signature
	 */
	readonly sign: (params: {
		hash: HexType;
	}) => Effect.Effect<SignatureType, AccountError>;

	/**
	 * Signs an unsigned transaction.
	 * @param tx - Transaction with all required fields populated
	 * @returns Signature
	 */
	readonly signTransaction: (
		tx: UnsignedTransaction,
	) => Effect.Effect<SignatureType, AccountError>;

	/**
	 * Signs EIP-712 typed structured data.
	 * @param typedData - Typed data to sign
	 * @returns Signature
	 */
	readonly signTypedData: (
		typedData: TypedDataType,
	) => Effect.Effect<SignatureType, AccountError>;

	/**
	 * Signs an EIP-7702 authorization tuple.
	 *
	 * @description
	 * Signs an authorization that allows the account's EOA to delegate code execution
	 * to a contract. The signed authorization can be included in a type 4 transaction.
	 *
	 * Per EIP-7702, the signing hash is: keccak256(MAGIC || rlp([chain_id, address, nonce]))
	 * where MAGIC = 0x05.
	 *
	 * @param authorization - The authorization to sign
	 * @returns Signed authorization with r, s, yParity
	 */
	readonly signAuthorization: (
		authorization: UnsignedAuthorization,
	) => Effect.Effect<SignedAuthorization, AccountError>;

	/**
	 * Securely zeros out the private key bytes in memory.
	 * Call this when done with the account to prevent key leakage.
	 * Only effective for local accounts. No-op for json-rpc/hardware.
	 * @returns Effect that completes when key is cleared
	 */
	readonly clearKey: () => Effect.Effect<void>;
};

/**
 * Account service for cryptographic signing operations.
 *
 * @description
 * Provides methods for signing messages, transactions, and typed data.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (LocalAccount or JsonRpcAccount) before running.
 *
 * The service is the foundation for SignerService signing operations.
 *
 * @since 0.0.1
 *
 * @example Using LocalAccount for local signing
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   AccountService,
 *   LocalAccount,
 *   Secp256k1Live,
 *   KeccakLive
 * } from 'voltaire-effect/services'
 * import { Hex } from '@tevm/voltaire'
 *
 * const privateKey = Hex.fromHex('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   console.log('Address:', account.address)
 *   const signature = yield* account.signMessage(messageHex)
 *   return signature
 * }).pipe(
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(Secp256k1Live),
 *   Effect.provide(KeccakLive)
 * )
 * ```
 *
 * @example Using JsonRpcAccount for browser wallet
 * ```typescript
 * import { Effect } from 'effect'
 * import { AccountService, JsonRpcAccount, BrowserTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   // Signing is delegated to the browser wallet
 *   const signature = yield* account.signMessage(messageHex)
 *   return signature
 * }).pipe(
 *   Effect.provide(JsonRpcAccount(userAddress)),
 *   Effect.provide(BrowserTransport)
 * )
 * ```
 *
 * @see {@link AccountShape} - The service interface shape
 * @see {@link AccountError} - Error type for failed operations
 * @see {@link LocalAccount} - Local private key implementation
 * @see {@link JsonRpcAccount} - Remote JSON-RPC implementation
 * @see {@link SignerService} - Uses AccountService for signing
 */
export class AccountService extends Context.Tag("AccountService")<
	AccountService,
	AccountShape
>() {}
