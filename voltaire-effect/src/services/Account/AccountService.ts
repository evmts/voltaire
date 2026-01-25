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
 * The service is used by WalletClientService for transaction signing.
 * 
 * @see {@link LocalAccount} - Local private key implementation
 * @see {@link JsonRpcAccount} - Remote JSON-RPC implementation
 * @see {@link WalletClientService} - Uses AccountService for signing
 */

import { BrandedAddress, BrandedHex, BrandedSignature, TypedData } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;

/**
 * Error thrown when an account operation fails.
 * 
 * @description
 * Contains the error message and optional underlying cause.
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
 * const error = new AccountError(
 *   'Failed to sign message',
 *   originalError
 * )
 * 
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
export class AccountError extends Error {
	/**
	 * Discriminant tag for Effect error handling.
	 * Use with Effect.catchTag('AccountError', ...) to handle this error type.
	 */
	readonly _tag = "AccountError" as const;
	
	/**
	 * Error name for standard JavaScript error handling.
	 */
	override readonly name = "AccountError" as const;

	/**
	 * Creates a new AccountError.
	 * 
	 * @param message - Human-readable error message
	 * @param cause - Optional underlying error that caused this failure
	 */
	constructor(
		message: string,
		public readonly cause?: Error,
	) {
		super(message, cause ? { cause } : undefined);
	}
}

/**
 * Unsigned transaction ready for signing.
 * 
 * @description
 * All required fields must be populated before signing.
 * This is different from TransactionRequest which has optional fields
 * that are auto-filled by WalletClientService.
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
	readonly to?: AddressType | null;
	/** Value in wei to send */
	readonly value?: bigint;
	/** Transaction input data */
	readonly data?: HexType;
	/** Transaction nonce (required) */
	readonly nonce: bigint;
	/** Gas limit (required) */
	readonly gasLimit: bigint;
	/** Gas price for legacy transactions (type 0) */
	readonly gasPrice?: bigint;
	/** Max fee per gas for EIP-1559 transactions (type 2) */
	readonly maxFeePerGas?: bigint;
	/** Max priority fee for EIP-1559 transactions (type 2) */
	readonly maxPriorityFeePerGas?: bigint;
	/** Chain ID for replay protection (required) */
	readonly chainId: bigint;
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
	 * Signs a message using EIP-191 personal_sign.
	 * @param message - The message to sign (hex-encoded)
	 * @returns Signature
	 */
	readonly signMessage: (
		message: HexType,
	) => Effect.Effect<SignatureType, AccountError>;
	
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
};

/**
 * Account service for cryptographic signing operations.
 * 
 * @description
 * Provides methods for signing messages, transactions, and typed data.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (LocalAccount or JsonRpcAccount) before running.
 * 
 * The service is the foundation for WalletClientService signing operations.
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
 * @see {@link WalletClientService} - Uses AccountService for signing
 */
export class AccountService extends Context.Tag("AccountService")<
	AccountService,
	AccountShape
>() {}
