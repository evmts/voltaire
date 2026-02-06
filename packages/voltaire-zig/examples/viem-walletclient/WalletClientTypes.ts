/**
 * Viem-compatible WalletClient Types for Voltaire
 *
 * Type definitions matching viem's WalletClient interface.
 *
 * @module WalletClientTypes
 */

// Re-export account types
export type {
	Hex,
	SignableMessage,
	EIP712Domain,
	TypeProperty,
	TypedDataDefinition,
	SignatureComponents,
	AuthorizationRequest,
	SignedAuthorization,
	SerializeTransactionFn,
	NonceManager,
	CustomSource,
	JsonRpcAccount,
	LocalAccount,
	PrivateKeyAccount,
	Account,
} from "../viem-account/AccountTypes.js";

/**
 * Address type (checksummed)
 */
export type Address = `0x${string}`;

/**
 * Transaction hash type
 */
export type Hash = `0x${string}`;

/**
 * Chain configuration
 */
export interface Chain {
	id: number;
	name: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	rpcUrls: {
		default: {
			http: readonly string[];
			webSocket?: readonly string[];
		};
	};
	blockExplorers?: {
		default: {
			name: string;
			url: string;
		};
	};
	contracts?: Record<string, { address: Address }>;
	formatters?: {
		transactionRequest?: {
			format: (request: unknown, type: string) => TransactionRequest;
		};
	};
	serializers?: {
		transaction?: SerializeTransactionFn;
	};
	blockTime?: number;
}

/**
 * Transaction type enum
 */
export type TransactionType =
	| "legacy"
	| "eip2930"
	| "eip1559"
	| "eip4844"
	| "eip7702";

/**
 * Access list entry
 */
export interface AccessListEntry {
	address: Address;
	storageKeys: readonly Hex[];
}

/**
 * Access list type
 */
export type AccessList = readonly AccessListEntry[];

/**
 * Base transaction request fields
 */
export interface TransactionRequestBase {
	from?: Address;
	to?: Address | null;
	data?: Hex;
	value?: bigint;
	nonce?: number;
	gas?: bigint;
	chainId?: number;
}

/**
 * Legacy transaction request
 */
export interface TransactionRequestLegacy extends TransactionRequestBase {
	type?: "legacy";
	gasPrice?: bigint;
	accessList?: never;
	maxFeePerGas?: never;
	maxPriorityFeePerGas?: never;
	maxFeePerBlobGas?: never;
	blobs?: never;
	blobVersionedHashes?: never;
}

/**
 * EIP-2930 transaction request
 */
export interface TransactionRequestEIP2930 extends TransactionRequestBase {
	type?: "eip2930";
	gasPrice?: bigint;
	accessList?: AccessList;
	maxFeePerGas?: never;
	maxPriorityFeePerGas?: never;
	maxFeePerBlobGas?: never;
	blobs?: never;
	blobVersionedHashes?: never;
}

/**
 * EIP-1559 transaction request
 */
export interface TransactionRequestEIP1559 extends TransactionRequestBase {
	type?: "eip1559";
	accessList?: AccessList;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	gasPrice?: never;
	maxFeePerBlobGas?: never;
	blobs?: never;
	blobVersionedHashes?: never;
}

/**
 * EIP-4844 transaction request (blob transaction)
 */
export interface TransactionRequestEIP4844 extends TransactionRequestBase {
	type?: "eip4844";
	accessList?: AccessList;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	maxFeePerBlobGas?: bigint;
	blobs?: readonly Hex[] | readonly Uint8Array[];
	blobVersionedHashes?: readonly Hex[];
	gasPrice?: never;
}

/**
 * EIP-7702 authorization
 */
export interface Authorization {
	address: Address;
	chainId: number;
	nonce: bigint;
	r: Hex;
	s: Hex;
	yParity: number;
}

/**
 * EIP-7702 transaction request
 */
export interface TransactionRequestEIP7702 extends TransactionRequestBase {
	type?: "eip7702";
	accessList?: AccessList;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	authorizationList?: readonly Authorization[];
	gasPrice?: never;
	maxFeePerBlobGas?: never;
	blobs?: never;
	blobVersionedHashes?: never;
}

/**
 * Union of all transaction request types
 */
export type TransactionRequest =
	| TransactionRequestLegacy
	| TransactionRequestEIP2930
	| TransactionRequestEIP1559
	| TransactionRequestEIP4844
	| TransactionRequestEIP7702;

/**
 * Transport request options
 */
export interface RequestOptions {
	dedupe?: boolean;
	retryCount?: number;
}

/**
 * RPC request function type
 */
export type RequestFn = <
	TMethod extends string,
	TParams = unknown[],
	TResult = unknown,
>(
	args: { method: TMethod; params?: TParams },
	options?: RequestOptions,
) => Promise<TResult>;

/**
 * Transport configuration
 */
export interface TransportConfig {
	key: string;
	name: string;
	type: string;
	retryCount?: number;
	retryDelay?: number;
	timeout?: number;
}

/**
 * Transport interface
 */
export type Transport = (params: {
	chain?: Chain;
	pollingInterval?: number;
}) => {
	config: TransportConfig;
	request: RequestFn;
	value?: unknown;
};

/**
 * Extension function type
 */
export type ExtendFn<TClient, TExtension> = (client: TClient) => TExtension;

/**
 * Send transaction parameters
 */
export interface SendTransactionParameters<
	TAccount extends Account | undefined = Account,
> {
	account?: TAccount | Address;
	chain?: Chain | null;
	to?: Address | null;
	data?: Hex;
	value?: bigint;
	gas?: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	maxFeePerBlobGas?: bigint;
	nonce?: number;
	accessList?: AccessList;
	authorizationList?: readonly Authorization[];
	blobs?: readonly Hex[] | readonly Uint8Array[];
	type?: TransactionType;
}

/**
 * Sign message parameters
 */
export interface SignMessageParameters<
	TAccount extends Account | undefined = Account,
> {
	account?: TAccount | Address;
	message: string | { raw: Hex | Uint8Array };
}

/**
 * Sign typed data parameters
 */
export interface SignTypedDataParameters<
	TTypes extends Record<string, readonly TypeProperty[]> = Record<
		string,
		TypeProperty[]
	>,
	TPrimaryType extends string = string,
	TAccount extends Account | undefined = Account,
> {
	account?: TAccount | Address;
	domain?: EIP712Domain;
	types: TTypes;
	primaryType: TPrimaryType;
	message: Record<string, unknown>;
}

/**
 * Sign transaction parameters
 */
export interface SignTransactionParameters<
	TAccount extends Account | undefined = Account,
> {
	account?: TAccount | Address;
	chain?: Chain | null;
	to?: Address | null;
	data?: Hex;
	value?: bigint;
	gas?: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	maxFeePerBlobGas?: bigint;
	nonce?: number;
	accessList?: AccessList;
	authorizationList?: readonly Authorization[];
	type?: TransactionType;
}

/**
 * Wallet actions decorator return type
 */
export interface WalletActions<TAccount extends Account | undefined = Account> {
	getAddresses: () => Promise<Address[]>;
	requestAddresses: () => Promise<Address[]>;
	sendTransaction: (args: SendTransactionParameters<TAccount>) => Promise<Hash>;
	signMessage: (args: SignMessageParameters<TAccount>) => Promise<Hex>;
	signTransaction: (args: SignTransactionParameters<TAccount>) => Promise<Hex>;
	signTypedData: <T extends Record<string, readonly TypeProperty[]>>(
		args: SignTypedDataParameters<T, string, TAccount>,
	) => Promise<Hex>;
	getChainId: () => Promise<number>;
	prepareTransactionRequest: (
		args: SendTransactionParameters<TAccount>,
	) => Promise<TransactionRequest>;
	sendRawTransaction: (args: { serializedTransaction: Hex }) => Promise<Hash>;
}

/**
 * Base client interface
 */
export interface Client<TAccount extends Account | undefined = Account> {
	account?: TAccount;
	chain?: Chain;
	key: string;
	name: string;
	type: string;
	uid: string;
	pollingInterval: number;
	cacheTime: number;
	request: RequestFn;
	transport: TransportConfig;
}

/**
 * WalletClient interface
 */
export interface WalletClient<TAccount extends Account | undefined = Account>
	extends Client<TAccount>,
		WalletActions<TAccount> {
	type: "walletClient";
	extend: <TExtension extends object>(
		fn: ExtendFn<WalletClient<TAccount>, TExtension>,
	) => WalletClient<TAccount> & TExtension;
}

/**
 * CreateWalletClient parameters
 */
export interface CreateWalletClientParameters<
	TAccount extends Account | undefined = undefined,
> {
	account?: TAccount | Address;
	chain?: Chain;
	transport: Transport;
	key?: string;
	name?: string;
	pollingInterval?: number;
	cacheTime?: number;
}

/**
 * Serialized transaction function type
 */
export type SerializeTransactionFn<T = TransactionRequest> = (
	transaction: T,
	signature?: SignatureComponents,
) => Hex;

import type { TypeProperty } from "../viem-account/AccountTypes.js";
