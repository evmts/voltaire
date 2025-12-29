/**
 * Ethers v6 Style Provider Types
 *
 * Type definitions for an ethers v6-compatible JsonRpcProvider implementation
 * using Voltaire primitives.
 *
 * @module examples/ethers-provider
 */

/**
 * Provider configuration options matching ethers v6 defaults
 */
export interface EthersProviderOptions {
	/** Request caching duration in ms. Set to -1 to disable. Default: 250 */
	cacheTimeout?: number;
	/** Block polling interval in ms. Default: 4000 */
	pollingInterval?: number;
	/** Use polling for event subscriptions. Default: false */
	polling?: boolean;
	/** Static network (skip network detection). Default: null */
	staticNetwork?: Network | boolean | null;
	/** Batch request stall time in ms. Default: 10 */
	batchStallTime?: number;
	/** Maximum batch size in bytes. Default: 1 << 20 (1MB) */
	batchMaxSize?: number;
	/** Maximum batch count. Default: 100 */
	batchMaxCount?: number;
}

/**
 * Network representation
 */
export interface Network {
	/** Network name (e.g., "mainnet", "sepolia") */
	name: string;
	/** Chain ID */
	chainId: bigint;
	/** ENS registry address */
	ensAddress?: string;
	/** ENS network (mainnet) for cross-chain resolution */
	ensNetwork?: number;

	/** Clone this network */
	clone(): Network;
	/** Check if this matches another network */
	matches(other: Networkish): boolean;
	/** Compute intrinsic gas for a transaction */
	computeIntrinsicGas(tx: TransactionLike): bigint;
}

/**
 * Network-like value for initialization
 */
export type Networkish = Network | string | number | bigint | { name: string; chainId: number };

/**
 * Block tag for specifying block context
 */
export type BlockTag =
	| "latest"
	| "earliest"
	| "pending"
	| "safe"
	| "finalized"
	| number
	| bigint
	| string; // hex block number or block hash

/**
 * Fee data wrapper
 */
export interface FeeData {
	/** Gas price for legacy transactions */
	gasPrice: bigint | null;
	/** Max fee per gas (EIP-1559) */
	maxFeePerGas: bigint | null;
	/** Max priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas: bigint | null;
}

/**
 * Block representation
 */
export interface Block {
	/** Block hash (null for pending) */
	hash: string | null;
	/** Parent block hash */
	parentHash: string;
	/** Block number */
	number: number;
	/** Block timestamp (seconds since epoch) */
	timestamp: number;
	/** Block nonce */
	nonce: string;
	/** Block difficulty */
	difficulty: bigint;
	/** Gas limit */
	gasLimit: bigint;
	/** Gas used */
	gasUsed: bigint;
	/** Miner/validator address */
	miner: string;
	/** Extra data */
	extraData: string;
	/** Base fee per gas (EIP-1559) */
	baseFeePerGas: bigint | null;
	/** Transaction hashes or full transactions */
	transactions: string[] | TransactionResponse[];
	/** Provider reference */
	provider: EthersProvider;
	/** Blob gas used (EIP-4844) */
	blobGasUsed: bigint | null;
	/** Excess blob gas (EIP-4844) */
	excessBlobGas: bigint | null;
	/** Parent beacon block root (EIP-4788) */
	parentBeaconBlockRoot: string | null;
	/** State root */
	stateRoot: string | null;
	/** Receipts root */
	receiptsRoot: string | null;
	/** Previous randao (post-merge) */
	prevRandao: string | null;
}

/**
 * Log entry from transaction execution
 */
export interface Log {
	/** Transaction hash */
	transactionHash: string;
	/** Block hash */
	blockHash: string;
	/** Block number */
	blockNumber: number;
	/** Whether log was removed (reorg) */
	removed: boolean;
	/** Contract address that emitted the log */
	address: string;
	/** Log data */
	data: string;
	/** Indexed topics */
	topics: readonly string[];
	/** Log index in block */
	index: number;
	/** Transaction index in block */
	transactionIndex: number;
	/** Provider reference */
	provider: EthersProvider;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
	/** Recipient address */
	to: string | null;
	/** Sender address */
	from: string;
	/** Deployed contract address (if contract creation) */
	contractAddress: string | null;
	/** Transaction hash */
	hash: string;
	/** Transaction index in block */
	index: number;
	/** Block hash */
	blockHash: string;
	/** Block number */
	blockNumber: number;
	/** Logs bloom filter */
	logsBloom: string;
	/** Gas used */
	gasUsed: bigint;
	/** Cumulative gas used */
	cumulativeGasUsed: bigint;
	/** Effective gas price */
	gasPrice: bigint;
	/** Transaction type */
	type: number;
	/** Transaction status (1 = success, 0 = revert) */
	status: number | null;
	/** State root (pre-Byzantium) */
	root: string | null;
	/** Logs emitted */
	logs: Log[];
	/** Blob gas used (EIP-4844) */
	blobGasUsed: bigint | null;
	/** Blob gas price (EIP-4844) */
	blobGasPrice: bigint | null;
	/** Provider reference */
	provider: EthersProvider;
}

/**
 * Transaction response (pending or mined)
 */
export interface TransactionResponse {
	/** Transaction hash */
	hash: string;
	/** Block hash (null if pending) */
	blockHash: string | null;
	/** Block number (null if pending) */
	blockNumber: number | null;
	/** Transaction index in block */
	index: number | null;
	/** Transaction type */
	type: number;
	/** Recipient address */
	to: string | null;
	/** Sender address */
	from: string;
	/** Nonce */
	nonce: number;
	/** Gas limit */
	gasLimit: bigint;
	/** Gas price */
	gasPrice: bigint;
	/** Max priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas: bigint | null;
	/** Max fee per gas (EIP-1559) */
	maxFeePerGas: bigint | null;
	/** Max fee per blob gas (EIP-4844) */
	maxFeePerBlobGas: bigint | null;
	/** Transaction data */
	data: string;
	/** Value in wei */
	value: bigint;
	/** Chain ID */
	chainId: bigint;
	/** Signature */
	signature: Signature;
	/** Access list (EIP-2930) */
	accessList: AccessListEntry[] | null;
	/** Blob versioned hashes (EIP-4844) */
	blobVersionedHashes: string[] | null;
	/** Provider reference */
	provider: EthersProvider;

	/** Wait for transaction confirmation */
	wait(confirms?: number, timeout?: number): Promise<TransactionReceipt | null>;
	/** Check if transaction is mined */
	isMined(): boolean;
	/** Get confirmations */
	confirmations(): Promise<number>;
}

/**
 * Access list entry
 */
export interface AccessListEntry {
	address: string;
	storageKeys: string[];
}

/**
 * Signature components
 */
export interface Signature {
	r: string;
	s: string;
	v: number;
	yParity?: number;
}

/**
 * Transaction request for calls/estimates
 */
export interface TransactionRequest {
	to?: string;
	from?: string;
	nonce?: number;
	gasLimit?: bigint;
	gasPrice?: bigint;
	maxPriorityFeePerGas?: bigint;
	maxFeePerGas?: bigint;
	data?: string;
	value?: bigint;
	chainId?: bigint;
	accessList?: AccessListEntry[];
	type?: number;
	blockTag?: BlockTag;
	enableCcipRead?: boolean;
}

/**
 * Transaction-like value
 */
export interface TransactionLike {
	to?: string | null;
	data?: string;
	accessList?: AccessListEntry[];
}

/**
 * Log filter
 */
export interface Filter {
	address?: string | string[];
	topics?: (string | string[] | null)[];
	fromBlock?: BlockTag;
	toBlock?: BlockTag;
	blockHash?: string;
}

/**
 * Event filter (for subscriptions)
 */
export interface EventFilter {
	address?: string | string[];
	topics?: (string | string[] | null)[];
}

/**
 * Provider event types
 */
export type ProviderEvent =
	| "block"
	| "pending"
	| "error"
	| "network"
	| "debug"
	| "safe"
	| "finalized"
	| EventFilter
	| string; // transaction hash

/**
 * Event listener function
 */
export type Listener = (...args: any[]) => void;

/**
 * JSON-RPC request payload
 */
export interface JsonRpcPayload {
	id: number;
	jsonrpc: "2.0";
	method: string;
	params: unknown[];
}

/**
 * JSON-RPC response
 */
export interface JsonRpcResponse {
	id: number;
	jsonrpc: "2.0";
	result?: unknown;
	error?: JsonRpcError;
}

/**
 * JSON-RPC error
 */
export interface JsonRpcError {
	code: number;
	message: string;
	data?: unknown;
}

/**
 * Provider error codes (matching ethers)
 */
export enum ErrorCode {
	CALL_EXCEPTION = "CALL_EXCEPTION",
	INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
	NONCE_EXPIRED = "NONCE_EXPIRED",
	REPLACEMENT_UNDERPRICED = "REPLACEMENT_UNDERPRICED",
	NETWORK_ERROR = "NETWORK_ERROR",
	TIMEOUT = "TIMEOUT",
	UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION",
	ACTION_REJECTED = "ACTION_REJECTED",
	TRANSACTION_REPLACED = "TRANSACTION_REPLACED",
	BAD_DATA = "BAD_DATA",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
	CANCELLED = "CANCELLED",
	OFFCHAIN_FAULT = "OFFCHAIN_FAULT",
	SERVER_ERROR = "SERVER_ERROR",
}

/**
 * Provider error with code
 */
export interface ProviderError extends Error {
	code: ErrorCode;
	info?: Record<string, unknown>;
}

/**
 * Subscriber interface for event management
 */
export interface Subscriber {
	start(): void;
	stop(): void;
	pause(dropWhilePaused?: boolean): void;
	resume(): void;
}

/**
 * Ethers v6 style provider interface
 */
export interface EthersProvider {
	// Network
	getNetwork(): Promise<Network>;
	getBlockNumber(): Promise<number>;
	getFeeData(): Promise<FeeData>;

	// Account
	getBalance(address: string, blockTag?: BlockTag): Promise<bigint>;
	getTransactionCount(address: string, blockTag?: BlockTag): Promise<number>;
	getCode(address: string, blockTag?: BlockTag): Promise<string>;
	getStorage(address: string, position: bigint, blockTag?: BlockTag): Promise<string>;

	// Execution
	call(tx: TransactionRequest): Promise<string>;
	estimateGas(tx: TransactionRequest): Promise<bigint>;

	// Transactions
	broadcastTransaction(signedTx: string): Promise<TransactionResponse>;
	getTransaction(hash: string): Promise<TransactionResponse | null>;
	getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;
	waitForTransaction(hash: string, confirms?: number, timeout?: number): Promise<TransactionReceipt | null>;

	// Blocks
	getBlock(blockHashOrTag: BlockTag | string, prefetchTxs?: boolean): Promise<Block | null>;

	// Logs
	getLogs(filter: Filter): Promise<Log[]>;

	// ENS (optional)
	resolveName?(name: string): Promise<string | null>;
	lookupAddress?(address: string): Promise<string | null>;

	// Raw RPC
	send(method: string, params: unknown[]): Promise<unknown>;

	// Events
	on(event: ProviderEvent, listener: Listener): Promise<this>;
	once(event: ProviderEvent, listener: Listener): Promise<this>;
	off(event: ProviderEvent, listener?: Listener): Promise<this>;
	removeAllListeners(event?: ProviderEvent): Promise<this>;
	listenerCount(event?: ProviderEvent): Promise<number>;
	listeners(event?: ProviderEvent): Promise<Listener[]>;
	emit(event: ProviderEvent, ...args: unknown[]): Promise<boolean>;

	// Lifecycle
	readonly destroyed: boolean;
	readonly paused: boolean;
	readonly pollingInterval: number;
	destroy(): void;
	pause(dropWhilePaused?: boolean): void;
	resume(): void;
}
