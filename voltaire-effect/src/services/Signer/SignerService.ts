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
 * Unlike ProviderService (read-only), SignerService requires an
 * AccountService for cryptographic signing operations.
 *
 * The service requires:
 * - AccountService - For signing (LocalAccount or JsonRpcAccount)
 * - ProviderService - For gas estimation and nonce lookup
 * - TransportService - For broadcasting transactions
 *
 * @see {@link Signer} - The live implementation layer and composition helpers
 * @see {@link AccountService} - Required for signing operations
 * @see {@link ProviderService} - For read operations
 */

import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
	EventLog,
	TypedData,
} from "@tevm/voltaire";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type {
	AuthorizationInput,
	UnsignedAuthorization,
} from "../Account/AccountService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;
type EventLogType = EventLog.EventLogType;

/**
 * Address input type that accepts both branded AddressType and plain hex strings.
 * Provides flexibility for API consumers while maintaining type safety.
 * Matches ProviderService.AddressInput for consistency.
 */
export type AddressInput = AddressType | `0x${string}`;

/**
 * Caveat applied to a permission.
 *
 * @since 0.0.1
 */
export interface Caveat {
	/** Caveat type */
	readonly type: string;
	/** Caveat value */
	readonly value: unknown;
}

/**
 * Wallet permission object per EIP-2255.
 *
 * @since 0.0.1
 */
export interface Permission {
	/** Parent capability (e.g., "eth_accounts") */
	readonly parentCapability: string;
	/** Invoker (origin) that was granted the permission */
	readonly invoker: string;
	/** Optional caveats restricting the permission */
	readonly caveats?: readonly Caveat[];
}

/**
 * Permission request object.
 *
 * @since 0.0.1
 */
export interface PermissionRequest {
	/** The permission being requested (e.g., "eth_accounts") */
	readonly [permission: string]: Record<string, unknown>;
}

/**
 * Native currency configuration for a chain.
 *
 * @since 0.0.1
 */
export interface NativeCurrency {
	/** Currency name (e.g., "Ether") */
	readonly name: string;
	/** Currency symbol (e.g., "ETH") */
	readonly symbol: string;
	/** Currency decimals (typically 18) */
	readonly decimals: number;
}

/**
 * Chain configuration for wallet_addEthereumChain (EIP-3085).
 *
 * @since 0.0.1
 */
export interface ChainConfig {
	/** Chain ID as a number */
	readonly id: number;
	/** Human-readable chain name */
	readonly name: string;
	/** Native currency configuration */
	readonly nativeCurrency: NativeCurrency;
	/** RPC URL endpoints */
	readonly rpcUrls: {
		readonly default: { readonly http: readonly string[] };
	};
	/** Block explorer URLs (optional) */
	readonly blockExplorers?: {
		readonly default: {
			readonly name: string;
			readonly url: string;
		};
	};
}

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
export class SignerError extends Data.TaggedError("SignerError")<{
	/**
	 * The original input that caused the error.
	 */
	readonly input: unknown;

	/**
	 * Human-readable error message.
	 */
	readonly message: string;

	/**
	 * JSON-RPC error code (propagated from underlying errors).
	 * May be undefined if the error originated outside JSON-RPC.
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
	 * Creates a new SignerError.
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
			message: message ?? options?.cause?.message ?? "Signer error",
			code: options?.code,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Transaction request for sending transactions.
 *
 * @description
 * Supports all Ethereum transaction types:
 * - Legacy (type 0) - original transactions with gasPrice
 * - EIP-2930 (type 1) - access list transactions with gasPrice
 * - EIP-1559 (type 2) - priority fee transactions
 * - EIP-4844 (type 3) - blob transactions for L2 data availability
 * - EIP-7702 (type 4) - set code transactions for smart account delegation
 *
 * Transaction type is auto-detected based on provided fields, or can be
 * explicitly set via the `type` field.
 *
 * Most fields are optional and will be auto-filled if not provided.
 *
 * Auto-filled fields:
 * - `nonce` - Fetched from network via getTransactionCount('pending')
 * - `gasLimit` - Estimated via estimateGas
 * - `gasPrice` or `maxFeePerGas` - Fetched from network
 * - `chainId` - Fetched from network via eth_chainId
 *
 * @since 0.0.1
 */
export type TransactionRequest = {
	/** Recipient address (null or undefined for contract deployment) */
	readonly to?: AddressInput | null;
	/** Value in wei to send with the transaction */
	readonly value?: bigint;
	/** Transaction input data (for contract calls/deployment) */
	readonly data?: HexType;
	/** Transaction nonce (auto-filled from network if not provided) */
	readonly nonce?: bigint;
	/** Gas limit (auto-estimated if not provided) */
	readonly gasLimit?: bigint;
	/** Gas price for legacy/EIP-2930 transactions (type 0/1) */
	readonly gasPrice?: bigint;
	/** Max fee per gas for EIP-1559+ transactions (type 2/3/4) */
	readonly maxFeePerGas?: bigint;
	/** Max priority fee (tip) for EIP-1559+ transactions (type 2/3/4) */
	readonly maxPriorityFeePerGas?: bigint;
	/** Chain ID for replay protection (auto-detected if not provided) */
	readonly chainId?: bigint;
	/** EIP-2930+ access list for pre-warming storage slots */
	readonly accessList?: Array<{
		address: AddressInput;
		storageKeys: Array<`0x${string}`>;
	}>;

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
	readonly authorizationList?: readonly AuthorizationInput[];
};

/**
 * Parameters for preparing an EIP-7702 authorization.
 *
 * @since 0.0.1
 */
export interface PrepareAuthorizationParams {
	/** Address of the contract to delegate to */
	readonly contractAddress: `0x${string}` | AddressType;
	/** Chain ID where the authorization is valid */
	readonly chainId?: bigint;
	/** Nonce of the authorizing account (fetched if not provided) */
	readonly nonce?: bigint;
}

/**
 * Parameters for EIP-5792 wallet_sendCalls.
 *
 * @description
 * Defines a batch of calls to be sent atomically via wallet_sendCalls.
 * Supported by smart contract wallets and some browser wallets.
 *
 * @since 0.0.1
 */
export interface SendCallsParams {
	/** Array of calls to execute atomically */
	readonly calls: readonly {
		/** Target contract address */
		readonly to: AddressInput;
		/** Calldata for the call */
		readonly data?: HexType;
		/** Value in wei to send */
		readonly value?: bigint;
	}[];
	/** Optional capabilities like paymaster service */
	readonly capabilities?: {
		/** Paymaster service configuration */
		readonly paymasterService?: { readonly url: string };
	};
}

/**
 * Status of an EIP-5792 call bundle.
 *
 * @description
 * Represents the current state of a batch of calls sent via wallet_sendCalls.
 *
 * @since 0.0.1
 */
export interface CallsStatus {
	/** Current status of the bundle */
	readonly status: "PENDING" | "CONFIRMED" | "FAILED";
	/** Transaction receipts (only present when CONFIRMED) */
	readonly receipts?: readonly {
		readonly transactionHash: HexType;
		readonly blockNumber: bigint;
		readonly gasUsed: bigint;
		readonly status: "success" | "reverted";
		readonly logs: readonly EventLogType[];
	}[];
}

/**
 * Wallet capabilities per chain (EIP-5792).
 *
 * @description
 * Describes what features a wallet supports for each chain.
 *
 * @since 0.0.1
 */
export interface WalletCapabilities {
	[chainId: string]: {
		/** Whether atomic batch transactions are supported */
		readonly atomicBatch?: { readonly supported: boolean };
		/** Whether paymaster service is supported */
		readonly paymasterService?: { readonly supported: boolean };
		/** Whether session keys are supported */
		readonly sessionKeys?: { readonly supported: boolean };
	};
}

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
	 * Prepares an EIP-7702 authorization tuple.
	 * @param params - Authorization parameters
	 * @returns Unsigned authorization ready for signing
	 */
	readonly prepareAuthorization: (
		params: PrepareAuthorizationParams,
	) => Effect.Effect<UnsignedAuthorization, SignerError>;

	/**
	 * Signs and broadcasts a transaction.
	 * @param tx - Transaction parameters
	 * @returns Transaction hash
	 */
	readonly sendTransaction: (
		tx: TransactionRequest,
	) => Effect.Effect<HashType, SignerError>;

	/**
	 * Broadcasts an already-signed transaction.
	 * @param signedTx - RLP-encoded signed transaction
	 * @returns Transaction hash
	 */
	readonly sendRawTransaction: (
		signedTx: HexType,
	) => Effect.Effect<HashType, SignerError>;

	/**
	 * Gets wallet addresses without prompting (eth_accounts).
	 * @returns Array of connected addresses
	 */
	readonly getAddresses: () => Effect.Effect<AddressType[], SignerError>;

	/**
	 * Requests wallet addresses (triggers wallet popup in browser).
	 * @returns Array of connected addresses
	 */
	readonly requestAddresses: () => Effect.Effect<AddressType[], SignerError>;

	/**
	 * Gets the current permissions granted to the dapp (EIP-2255).
	 * @returns Array of granted permissions
	 */
	readonly getPermissions: () => Effect.Effect<Permission[], SignerError>;

	/**
	 * Requests specific permissions from the wallet (EIP-2255).
	 * @param permissions - Object with permission names as keys
	 * @returns Array of granted permissions
	 */
	readonly requestPermissions: (
		permissions: PermissionRequest,
	) => Effect.Effect<Permission[], SignerError>;

	/**
	 * Requests the wallet to add a new chain (EIP-3085).
	 * @param chain - Chain configuration to add
	 */
	readonly addChain: (chain: ChainConfig) => Effect.Effect<void, SignerError>;

	/**
	 * Requests wallet to switch to a different chain.
	 * @param chainId - Target chain ID (e.g., 1 for mainnet)
	 */
	readonly switchChain: (chainId: number) => Effect.Effect<void, SignerError>;

	/**
	 * Gets wallet capabilities per chain (EIP-5792).
	 * @param account - Optional account address to query capabilities for
	 * @returns Wallet capabilities indexed by chain ID
	 */
	readonly getCapabilities: (
		account?: AddressInput,
	) => Effect.Effect<WalletCapabilities, SignerError>;

	/**
	 * Sends a batch of calls atomically (EIP-5792).
	 * @param params - Batch call parameters
	 * @returns Bundle ID for tracking the batch
	 */
	readonly sendCalls: (
		params: SendCallsParams,
	) => Effect.Effect<string, SignerError>;

	/**
	 * Gets the status of a call bundle (EIP-5792).
	 * @param bundleId - The bundle ID returned from sendCalls
	 * @returns Current status and receipts if confirmed
	 */
	readonly getCallsStatus: (
		bundleId: string,
	) => Effect.Effect<CallsStatus, SignerError>;

	/**
	 * Waits for a call bundle to complete (EIP-5792).
	 * @param bundleId - The bundle ID returned from sendCalls
	 * @param options - Polling options
	 * @returns Final status with receipts
	 */
	readonly waitForCallsStatus: (
		bundleId: string,
		options?: { readonly timeout?: number; readonly pollingInterval?: number },
	) => Effect.Effect<CallsStatus, SignerError>;
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
 * - Wallet interaction (getAddresses, requestAddresses, getPermissions, requestPermissions, addChain, switchChain)
 *
 * Requires:
 * - AccountService - For cryptographic signing
 * - ProviderService - For gas estimation and nonce
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
