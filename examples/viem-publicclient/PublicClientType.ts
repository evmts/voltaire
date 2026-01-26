/**
 * PublicClient Type Definitions
 *
 * Viem-compatible PublicClient types using Voltaire primitives.
 *
 * @module examples/viem-publicclient
 */

import type { AddressType, HexType, Item } from "@tevm/voltaire";

// ============================================================================
// Block Tag Types
// ============================================================================

/**
 * Block tag for specifying block state
 */
export type BlockTag = "latest" | "earliest" | "pending" | "safe" | "finalized";

/**
 * Block identifier - either number or tag
 */
export type BlockIdentifier = bigint | BlockTag;

// ============================================================================
// Override Types
// ============================================================================

/**
 * State override mapping for eth_call / eth_estimateGas
 */
export type StateOverride = Record<
	string,
	{
		/** Account balance override */
		balance?: bigint;
		/** Account nonce override */
		nonce?: bigint;
		/** Account bytecode override */
		code?: HexType | string | Uint8Array;
		/** Storage override (full replacement) */
		state?: Record<string, HexType | string | Uint8Array>;
		/** Storage override (diff) */
		stateDiff?: Record<string, HexType | string | Uint8Array>;
	}
>;

/**
 * Block overrides for eth_call / eth_estimateGas
 */
export interface BlockOverrides {
	/** Block number override */
	number?: bigint;
	/** Block timestamp override */
	time?: bigint;
	/** Block gas limit override */
	gasLimit?: bigint;
	/** Block base fee override */
	baseFee?: bigint;
	/** Block blob base fee override */
	blobBaseFee?: bigint;
}

// ============================================================================
// Chain Types
// ============================================================================

/**
 * Chain configuration
 */
export interface Chain {
	/** Chain ID */
	id: number;
	/** Chain name */
	name: string;
	/** Native currency */
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	/** RPC endpoints */
	rpcUrls: {
		default: {
			http: readonly string[];
			webSocket?: readonly string[];
		};
	};
	/** Block time in milliseconds */
	blockTime?: number;
	/** Block explorers */
	blockExplorers?: {
		default: {
			name: string;
			url: string;
		};
	};
}

// ============================================================================
// Transport Types
// ============================================================================

/**
 * Transport configuration
 */
export interface TransportConfig {
	/** Transport key identifier */
	key: string;
	/** Transport name */
	name: string;
	/** Request function */
	request: RequestFn;
	/** Retry count */
	retryCount: number;
	/** Retry delay in ms */
	retryDelay: number;
	/** Request timeout in ms */
	timeout?: number;
	/** Transport type */
	type: string;
}

/**
 * Transport value (transport-specific data)
 */
export interface TransportValue {
	/** URL for HTTP transport */
	url?: string;
	/** Fetch options */
	fetchOptions?: RequestInit;
}

/**
 * Transport result from factory
 */
export interface Transport {
	config: TransportConfig;
	request: RequestFn;
	value?: TransportValue;
}

/**
 * Transport factory function
 */
export type TransportFactory = (params: {
	chain?: Chain;
	pollingInterval?: number;
}) => Transport;

// ============================================================================
// Request Types
// ============================================================================

/**
 * JSON-RPC request function
 */
export type RequestFn = <TResult = unknown>(args: {
	method: string;
	params?: unknown[];
}) => Promise<TResult>;

/**
 * Request options
 */
export interface RequestOptions {
	/** Deduplicate concurrent requests */
	dedupe?: boolean;
}

// ============================================================================
// Client Types
// ============================================================================

/**
 * Base client configuration
 */
export interface ClientConfig {
	/** Batching configuration */
	batch?: {
		multicall?: {
			batchSize?: number;
			wait?: number;
		};
	};
	/** Cache time in ms */
	cacheTime?: number;
	/** Chain configuration */
	chain?: Chain;
	/** Client key */
	key?: string;
	/** Client name */
	name?: string;
	/** Polling interval in ms */
	pollingInterval?: number;
	/** Transport factory */
	transport: TransportFactory;
}

/**
 * Public client configuration
 */
export interface PublicClientConfig extends ClientConfig {
	/** Client key (default: 'public') */
	key?: string;
	/** Client name (default: 'Public Client') */
	name?: string;
}

/**
 * Base client interface
 */
export interface Client {
	/** Batching configuration */
	batch?: ClientConfig["batch"];
	/** Cache time in ms */
	cacheTime: number;
	/** Chain configuration */
	chain?: Chain;
	/** Client key */
	key: string;
	/** Client name */
	name: string;
	/** Polling interval */
	pollingInterval: number;
	/** Request function */
	request: RequestFn;
	/** Transport */
	transport: TransportConfig & TransportValue;
	/** Client type */
	type: string;
	/** Unique client ID */
	uid: string;
	/** Extend client with additional actions */
	extend: <TExtension extends Record<string, unknown>>(
		fn: (client: this) => TExtension,
	) => this & TExtension & { extend: Client["extend"] };
}

// ============================================================================
// Action Parameter Types
// ============================================================================

/**
 * getBlockNumber parameters
 */
export interface GetBlockNumberParameters {
	/** Cache time override */
	cacheTime?: number;
}

/**
 * getBalance parameters
 */
export interface GetBalanceParameters {
	/** Address to get balance for */
	address: AddressType | string;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
}

/**
 * getBlock parameters
 */
export interface GetBlockParameters {
	/** Block hash */
	blockHash?: string;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
	/** Include full transactions */
	includeTransactions?: boolean;
}

/**
 * call parameters
 */
export interface CallParameters {
	/** Account to call from */
	account?: AddressType | string;
	/** Call data */
	data?: HexType | string;
	/** Target address */
	to?: AddressType | string;
	/** Value to send */
	value?: bigint;
	/** Gas limit */
	gas?: bigint;
	/** Gas price */
	gasPrice?: bigint;
	/** Max fee per gas (EIP-1559) */
	maxFeePerGas?: bigint;
	/** Max priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas?: bigint;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
	/** State overrides */
	stateOverride?: StateOverride;
	/** Block overrides */
	blockOverrides?: BlockOverrides;
}

/**
 * estimateGas parameters
 */
export interface EstimateGasParameters {
	/** Account */
	account?: AddressType | string;
	/** Call data */
	data?: HexType | string;
	/** Target address */
	to?: AddressType | string;
	/** Value to send */
	value?: bigint;
	/** Gas limit */
	gas?: bigint;
	/** Gas price */
	gasPrice?: bigint;
	/** Max fee per gas */
	maxFeePerGas?: bigint;
	/** Max priority fee per gas */
	maxPriorityFeePerGas?: bigint;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
	/** State overrides */
	stateOverride?: StateOverride;
	/** Block overrides */
	blockOverrides?: BlockOverrides;
}

/**
 * simulateContract parameters
 */
export type SimulateContractParameters = {
	/** Contract ABI */
	abi: readonly Item[];
	/** Contract address */
	address: AddressType | string;
	/** Function name to call */
	functionName: string;
	/** Function arguments */
	args?: readonly unknown[];
	/** Optional data suffix */
	dataSuffix?: `0x${string}`;
} & Omit<CallParameters, "data" | "to">;

/**
 * simulateContract return type
 */
export type SimulateContractReturnType = {
	/** Decoded result */
	result: unknown;
	/** Request object (can be passed to writeContract) */
	request: {
		abi: readonly Item[];
		address: string;
		args: readonly unknown[];
		dataSuffix?: `0x${string}`;
		functionName: string;
	} & Omit<CallParameters, "data" | "to">;
};

/**
 * getTransaction parameters
 */
export interface GetTransactionParameters {
	/** Transaction hash */
	hash?: string;
	/** Block hash (with index) */
	blockHash?: string;
	/** Block number (with index) */
	blockNumber?: bigint;
	/** Block tag (with index) */
	blockTag?: BlockTag;
	/** Transaction index in block */
	index?: number;
}

/**
 * getTransactionReceipt parameters
 */
export interface GetTransactionReceiptParameters {
	/** Transaction hash */
	hash: string;
}

/**
 * getLogs parameters
 */
export interface GetLogsParameters {
	/** Contract address(es) */
	address?: AddressType | string | (AddressType | string)[];
	/** From block */
	fromBlock?: bigint | BlockTag;
	/** To block */
	toBlock?: bigint | BlockTag;
	/** Block hash (alternative to fromBlock/toBlock) */
	blockHash?: string;
	/** Event topics */
	topics?: (string | string[] | null)[];
}

/**
 * getCode parameters
 */
export interface GetCodeParameters {
	/** Contract address */
	address: AddressType | string;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
}

/**
 * getStorageAt parameters
 */
export interface GetStorageAtParameters {
	/** Contract address */
	address: AddressType | string;
	/** Storage slot */
	slot: string;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
}

/**
 * getTransactionCount parameters
 */
export interface GetTransactionCountParameters {
	/** Address */
	address: AddressType | string;
	/** Block number */
	blockNumber?: bigint;
	/** Block tag */
	blockTag?: BlockTag;
}

// ============================================================================
// Return Types
// ============================================================================

/**
 * Block data
 */
export interface Block {
	baseFeePerGas?: bigint;
	blobGasUsed?: bigint;
	difficulty?: bigint;
	excessBlobGas?: bigint;
	extraData: string;
	gasLimit: bigint;
	gasUsed: bigint;
	hash: string | null;
	logsBloom: string | null;
	miner: string;
	mixHash?: string;
	nonce: string | null;
	number: bigint | null;
	parentBeaconBlockRoot?: string;
	parentHash: string;
	receiptsRoot: string;
	sha3Uncles: string;
	size: bigint;
	stateRoot: string;
	timestamp: bigint;
	totalDifficulty?: bigint;
	transactions: string[] | Transaction[];
	transactionsRoot: string;
	uncles: string[];
	withdrawals?: Withdrawal[];
	withdrawalsRoot?: string;
}

/**
 * Transaction data
 */
export interface Transaction {
	blockHash: string | null;
	blockNumber: bigint | null;
	from: string;
	gas: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	hash: string;
	input: string;
	nonce: number;
	to: string | null;
	transactionIndex: number | null;
	value: bigint;
	type: string;
	accessList?: AccessListItem[];
	chainId?: number;
	v: bigint;
	r: string;
	s: string;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
	blockHash: string;
	blockNumber: bigint;
	contractAddress: string | null;
	cumulativeGasUsed: bigint;
	effectiveGasPrice: bigint;
	from: string;
	gasUsed: bigint;
	logs: Log[];
	logsBloom: string;
	status: "success" | "reverted";
	to: string | null;
	transactionHash: string;
	transactionIndex: number;
	type: string;
}

/**
 * Log entry
 */
export interface Log {
	address: string;
	blockHash: string | null;
	blockNumber: bigint | null;
	data: string;
	logIndex: number | null;
	removed: boolean;
	topics: string[];
	transactionHash: string | null;
	transactionIndex: number | null;
}

/**
 * Access list item
 */
export interface AccessListItem {
	address: string;
	storageKeys: string[];
}

/**
 * Withdrawal data
 */
export interface Withdrawal {
	index: bigint;
	validatorIndex: bigint;
	address: string;
	amount: bigint;
}

/**
 * Call result
 */
export interface CallResult {
	data?: string;
}

// ============================================================================
// Public Actions Interface
// ============================================================================

/**
 * Public client actions
 */
export interface PublicActions {
	/** Get current block number */
	getBlockNumber: (args?: GetBlockNumberParameters) => Promise<bigint>;
	/** Get balance of address */
	getBalance: (args: GetBalanceParameters) => Promise<bigint>;
	/** Get block data */
	getBlock: (args?: GetBlockParameters) => Promise<Block>;
	/** Execute call without creating transaction */
	call: (args: CallParameters) => Promise<CallResult>;
	/** Estimate gas for transaction */
	estimateGas: (args: EstimateGasParameters) => Promise<bigint>;
	/** Simulate contract call and decode result */
	simulateContract: (
		args: SimulateContractParameters,
	) => Promise<SimulateContractReturnType>;
	/** Get transaction by hash */
	getTransaction: (args: GetTransactionParameters) => Promise<Transaction>;
	/** Get transaction receipt */
	getTransactionReceipt: (
		args: GetTransactionReceiptParameters,
	) => Promise<TransactionReceipt>;
	/** Get logs matching filter */
	getLogs: (args?: GetLogsParameters) => Promise<Log[]>;
	/** Get chain ID */
	getChainId: () => Promise<number>;
	/** Get contract bytecode */
	getCode: (args: GetCodeParameters) => Promise<string | undefined>;
	/** Get storage at slot */
	getStorageAt: (args: GetStorageAtParameters) => Promise<string | undefined>;
	/** Get transaction count (nonce) */
	getTransactionCount: (args: GetTransactionCountParameters) => Promise<number>;
	/** Get current gas price */
	getGasPrice: () => Promise<bigint>;
}

/**
 * Public client type
 */
export type PublicClient = Client & PublicActions;
