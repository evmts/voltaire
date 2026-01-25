/**
 * @fileoverview Wallet client service definition for signing and transaction operations.
 * 
 * @module WalletClientService
 * @since 0.0.1
 * 
 * @description
 * The WalletClientService provides a high-level interface for wallet operations
 * including signing messages, signing transactions, and sending transactions.
 * 
 * Unlike PublicClientService (read-only), WalletClientService requires an
 * AccountService for cryptographic signing operations.
 * 
 * The service requires:
 * - AccountService - For signing (LocalAccount or JsonRpcAccount)
 * - PublicClientService - For gas estimation and nonce lookup
 * - TransportService - For broadcasting transactions
 * 
 * @see {@link WalletClientLive} - The live implementation layer
 * @see {@link AccountService} - Required for signing operations
 * @see {@link PublicClientService} - For read operations
 */

import { BrandedAddress, BrandedHex, BrandedSignature, TypedData } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;

/**
 * Error thrown when a wallet client operation fails.
 * 
 * @description
 * Contains the original input, error message and optional underlying cause.
 * All WalletClientService methods may fail with this error type.
 * 
 * Common failure reasons:
 * - User rejected the request (in browser wallet)
 * - Insufficient funds for transaction
 * - Invalid transaction parameters
 * - Network errors during broadcast
 * - Signing failures
 * 
 * @since 0.0.1
 * 
 * @example Creating a WalletClientError
 * ```typescript
 * const error = new WalletClientError(
 *   { to: '0x123...', value: 1000000000000000000n },
 *   'Failed to send transaction',
 *   { cause: originalError }
 * )
 * 
 * console.log(error.input)   // { to: '0x123...', value: 1000000000000000000n }
 * console.log(error.message) // 'Failed to send transaction'
 * console.log(error.cause)   // originalError
 * ```
 * 
 * @example Handling WalletClientError in Effect
 * ```typescript
 * import { Effect } from 'effect'
 * import { WalletClientService, WalletClientError } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   return yield* wallet.sendTransaction({ to: recipient, value: 1n })
 * }).pipe(
 *   Effect.catchTag('WalletClientError', (error) => {
 *     if (error.message.includes('insufficient funds')) {
 *       console.error('Not enough ETH for transaction')
 *     }
 *     return Effect.fail(error)
 *   })
 * )
 * ```
 */
export class WalletClientError extends Error {
	/**
	 * Discriminant tag for Effect error handling.
	 * Use with Effect.catchTag('WalletClientError', ...) to handle this error type.
	 */
	readonly _tag = "WalletClientError" as const;
	
	/**
	 * Error name for standard JavaScript error handling.
	 */
	override readonly name = "WalletClientError" as const;
	
	/**
	 * The underlying error that caused this failure.
	 */
	override readonly cause?: Error;

	/**
	 * Creates a new WalletClientError.
	 * 
	 * @param input - The original input that caused the error
	 * @param message - Human-readable error message
	 * @param options - Optional error options
	 * @param options.cause - Underlying error that caused this failure
	 */
	constructor(
		public readonly input: unknown,
		message: string,
		options?: { cause?: Error },
	) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.cause = options?.cause;
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
 * 
 * @example Simple ETH transfer
 * ```typescript
 * const tx: TransactionRequest = {
 *   to: Address.fromHex('0x1234...'),
 *   value: 1000000000000000000n // 1 ETH
 * }
 * ```
 * 
 * @example Contract interaction
 * ```typescript
 * const tx: TransactionRequest = {
 *   to: contractAddress,
 *   data: encodedFunctionCall,
 *   value: 0n
 * }
 * ```
 * 
 * @example EIP-1559 transaction
 * ```typescript
 * const tx: TransactionRequest = {
 *   to: recipient,
 *   value: 1000000000000000000n,
 *   maxFeePerGas: 50000000000n,      // 50 gwei
 *   maxPriorityFeePerGas: 2000000000n // 2 gwei
 * }
 * ```
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
 * Shape of the wallet client service.
 * 
 * @description
 * Defines all signing and transaction operations available through WalletClientService.
 * Each method returns an Effect that may fail with WalletClientError.
 * 
 * @since 0.0.1
 */
export type WalletClientShape = {
	/**
	 * Signs a message using EIP-191 personal_sign.
	 * @param message - The message to sign (hex-encoded)
	 * @returns Signature
	 */
	readonly signMessage: (
		message: HexType,
	) => Effect.Effect<SignatureType, WalletClientError>;
	
	/**
	 * Signs a transaction without broadcasting.
	 * @param tx - Transaction parameters
	 * @returns Signed transaction (hex-encoded)
	 */
	readonly signTransaction: (
		tx: TransactionRequest,
	) => Effect.Effect<HexType, WalletClientError>;
	
	/**
	 * Signs EIP-712 typed structured data.
	 * @param typedData - Typed data to sign
	 * @returns Signature
	 */
	readonly signTypedData: (
		typedData: TypedDataType,
	) => Effect.Effect<SignatureType, WalletClientError>;
	
	/**
	 * Signs and broadcasts a transaction.
	 * @param tx - Transaction parameters
	 * @returns Transaction hash
	 */
	readonly sendTransaction: (
		tx: TransactionRequest,
	) => Effect.Effect<HexType, WalletClientError>;
	
	/**
	 * Broadcasts an already-signed transaction.
	 * @param signedTx - RLP-encoded signed transaction
	 * @returns Transaction hash
	 */
	readonly sendRawTransaction: (
		signedTx: HexType,
	) => Effect.Effect<HexType, WalletClientError>;
	
	/**
	 * Requests wallet addresses (triggers wallet popup in browser).
	 * @returns Array of connected addresses
	 */
	readonly requestAddresses: () => Effect.Effect<
		AddressType[],
		WalletClientError
	>;
	
	/**
	 * Requests wallet to switch to a different chain.
	 * @param chainId - Target chain ID (e.g., 1 for mainnet)
	 */
	readonly switchChain: (
		chainId: number,
	) => Effect.Effect<void, WalletClientError>;
};

/**
 * Wallet client service for signing and sending transactions.
 * 
 * @description
 * Provides methods for signing messages, transactions, and typed data.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (WalletClientLive layer) before running.
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
 * @example Sending a transaction with local account
 * ```typescript
 * import { Effect } from 'effect'
 * import { 
 *   WalletClientService, 
 *   WalletClientLive, 
 *   LocalAccount,
 *   PublicClient,
 *   HttpTransport 
 * } from 'voltaire-effect/services'
 * import { Hex } from '@tevm/voltaire'
 * 
 * const privateKey = Hex.fromHex('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   const txHash = yield* wallet.sendTransaction({
 *     to: recipientAddress,
 *     value: 1000000000000000000n // 1 ETH
 *   })
 *   return txHash
 * }).pipe(
 *   Effect.provide(WalletClientLive),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * 
 * await Effect.runPromise(program)
 * ```
 * 
 * @example Signing a message
 * ```typescript
 * import { Effect } from 'effect'
 * import { WalletClientService, WalletClientLive, LocalAccount } from 'voltaire-effect/services'
 * import { Hex } from '@tevm/voltaire'
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   const message = Hex.fromString('Hello, Ethereum!')
 *   const signature = yield* wallet.signMessage(message)
 *   return signature
 * }).pipe(
 *   Effect.provide(WalletClientLive),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * 
 * @example Using with browser wallet
 * ```typescript
 * import { Effect } from 'effect'
 * import { 
 *   WalletClientService, 
 *   WalletClientLive,
 *   JsonRpcAccount,
 *   PublicClient,
 *   BrowserTransport 
 * } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   
 *   // Request wallet connection
 *   const accounts = yield* wallet.requestAddresses()
 *   
 *   // Send transaction (will trigger MetaMask popup)
 *   const txHash = yield* wallet.sendTransaction({
 *     to: recipientAddress,
 *     value: 1000000000000000000n
 *   })
 *   
 *   return txHash
 * }).pipe(
 *   Effect.provide(WalletClientLive),
 *   Effect.provide(JsonRpcAccount(userAddress)),
 *   Effect.provide(PublicClient),
 *   Effect.provide(BrowserTransport)
 * )
 * ```
 * 
 * @see {@link WalletClientLive} - The live implementation layer
 * @see {@link WalletClientShape} - The service interface shape
 * @see {@link WalletClientError} - Error type for failed operations
 * @see {@link AccountService} - Required for signing
 * @see {@link LocalAccount} - Local private key account
 * @see {@link JsonRpcAccount} - Remote JSON-RPC account
 */
export class WalletClientService extends Context.Tag("WalletClientService")<
	WalletClientService,
	WalletClientShape
>() {}
