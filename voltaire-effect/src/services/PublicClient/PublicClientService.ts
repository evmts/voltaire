/**
 * @fileoverview Public client service definition for read-only blockchain operations.
 * 
 * @module PublicClientService
 * @since 0.0.1
 * 
 * @description
 * The PublicClientService provides a high-level interface for querying Ethereum
 * blockchain data. It abstracts away the underlying JSON-RPC details and provides
 * type-safe methods for common operations like getting balances, blocks, and transactions.
 * 
 * All methods are read-only and do not require signing or wallet access.
 * For write operations (sending transactions), use WalletClientService.
 * 
 * The service requires a TransportService to be provided for actual RPC communication.
 * 
 * @see {@link PublicClient} - The live implementation layer
 * @see {@link WalletClientService} - For write operations
 * @see {@link TransportService} - The underlying transport layer
 */

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import type { HexType } from "@tevm/voltaire/Hex";

/**
 * Address input type that accepts both branded AddressType and plain hex strings.
 * Provides flexibility for API consumers while maintaining type safety.
 */
export type AddressInput = AddressType | `0x${string}`;

/**
 * Hash input type that accepts both branded HashType and plain hex strings.
 */
export type HashInput = HashType | `0x${string}`;

/**
 * Error thrown when a public client operation fails.
 * 
 * @description
 * Contains the original input and optional cause for debugging.
 * All PublicClientService methods may fail with this error type.
 * 
 * Common failure reasons:
 * - Network connectivity issues
 * - Invalid parameters (bad address, block not found)
 * - RPC node errors
 * - Rate limiting
 * 
 * @since 0.0.1
 * 
 * @example Creating a PublicClientError
 * ```typescript
 * const error = new PublicClientError(
 *   { method: 'eth_getBalance', params: ['0x...'] },
 *   'Failed to fetch balance',
 *   originalError
 * )
 * 
 * console.log(error.input)   // { method: 'eth_getBalance', params: ['0x...'] }
 * console.log(error.message) // 'Failed to fetch balance'
 * console.log(error.cause)   // originalError
 * ```
 * 
 * @example Handling PublicClientError in Effect
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, PublicClientError } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getBalance('0x...')
 * }).pipe(
 *   Effect.catchTag('PublicClientError', (error) => {
 *     console.error('Failed:', error.message, 'Input:', error.input)
 *     return Effect.succeed(0n)
 *   })
 * )
 * ```
 */
export class PublicClientError extends Error {
	/**
	 * Discriminant tag for Effect error handling.
	 * Use with Effect.catchTag('PublicClientError', ...) to handle this error type.
	 */
	readonly _tag = "PublicClientError" as const;
	
	/**
	 * Error name for standard JavaScript error handling.
	 */
	override readonly name = "PublicClientError" as const;
	
	/**
	 * The underlying error that caused this failure.
	 */
	override readonly cause?: Error;

	/**
	 * Creates a new PublicClientError.
	 * 
	 * @param input - The original input that caused the error (method, params, etc.)
	 * @param message - Human-readable error message (optional, defaults to cause message)
	 * @param options - Optional error options
	 * @param options.cause - Underlying error that caused this failure
	 */
	constructor(
		public readonly input: unknown,
		message?: string,
		options?: { cause?: Error },
	) {
		super(message ?? options?.cause?.message ?? `PublicClient error`, options?.cause ? { cause: options.cause } : undefined);
		this.cause = options?.cause;
	}
}

/**
 * Block identifier for Ethereum RPC calls.
 * 
 * @description
 * Used to specify which block to query for operations like getBalance, getCode, etc.
 * Can be a named tag for special blocks or a hex-encoded block number.
 * 
 * Named tags:
 * - `"latest"` - Most recent mined block
 * - `"earliest"` - Genesis block
 * - `"pending"` - Pending block (transactions in mempool)
 * - `"safe"` - Latest safe head block (2/3 attestations)
 * - `"finalized"` - Latest finalized block (cannot be reverted)
 * 
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * // Using named tags
 * const balance1 = yield* client.getBalance(address, 'latest')
 * const balance2 = yield* client.getBalance(address, 'finalized')
 * 
 * // Using hex block number
 * const balance3 = yield* client.getBalance(address, '0x1234')
 * ```
 */
export type BlockTag = "latest" | "earliest" | "pending" | "safe" | "finalized" | `0x${string}`;

/**
 * Request parameters for eth_call and eth_estimateGas.
 * 
 * @description
 * Defines the parameters for simulating a transaction call without
 * actually sending it to the network. Used for reading contract state
 * and estimating gas costs.
 * 
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * const callRequest: CallRequest = {
 *   to: '0x1234...',           // Contract address
 *   from: '0x5678...',         // Sender address (optional)
 *   data: '0x...',             // Encoded function call
 *   value: 0n,                 // ETH to send (optional)
 *   gas: 100000n               // Gas limit (optional)
 * }
 * ```
 */
export interface CallRequest {
	/** Target contract address to call */
	readonly to?: AddressInput;
	/** Sender address (affects msg.sender in call) */
	readonly from?: AddressInput;
	/** ABI-encoded function call data */
	readonly data?: HexType | `0x${string}`;
	/** Value in wei to send with the call */
	readonly value?: bigint;
	/** Gas limit for the call (defaults to node estimate) */
	readonly gas?: bigint;
}

/**
 * Filter parameters for eth_getLogs.
 * 
 * @description
 * Defines the criteria for querying event logs from contracts.
 * Can filter by address, topics, and block range.
 * 
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * // Get all Transfer events from a token contract
 * const filter: LogFilter = {
 *   address: '0x1234...',
 *   topics: ['0xddf252ad...'], // Transfer event signature
 *   fromBlock: 'latest',
 *   toBlock: 'latest'
 * }
 * ```
 */
export interface LogFilter {
	/** Contract address(es) to filter (single or array) */
	readonly address?: AddressInput | AddressInput[];
	/** Topic filters by position (null for wildcard at that position) */
	readonly topics?: (HashInput | HashInput[] | null)[];
	/** Start block for range query (inclusive) */
	readonly fromBlock?: BlockTag;
	/** End block for range query (inclusive) */
	readonly toBlock?: BlockTag;
	/** Specific block hash (mutually exclusive with fromBlock/toBlock) */
	readonly blockHash?: HashInput;
}

/**
 * Ethereum block as returned by JSON-RPC.
 * 
 * @description
 * Contains all block header fields and optionally full transaction objects.
 * All numeric fields are hex-encoded strings.
 * 
 * @since 0.0.1
 */
export interface BlockType {
	/** Block number (hex-encoded) */
	number: string;
	/** Block hash */
	hash: string;
	/** Parent block hash */
	parentHash: string;
	/** Proof-of-work nonce */
	nonce: string;
	/** Hash of uncle blocks */
	sha3Uncles: string;
	/** Bloom filter for logs */
	logsBloom: string;
	/** Merkle root of transactions */
	transactionsRoot: string;
	/** Merkle root of state trie */
	stateRoot: string;
	/** Merkle root of receipts */
	receiptsRoot: string;
	/** Block miner/validator address */
	miner: string;
	/** Block difficulty (legacy PoW) */
	difficulty: string;
	/** Cumulative difficulty (legacy PoW) */
	totalDifficulty: string;
	/** Extra data included by miner */
	extraData: string;
	/** Block size in bytes (hex) */
	size: string;
	/** Block gas limit (hex) */
	gasLimit: string;
	/** Total gas used by transactions (hex) */
	gasUsed: string;
	/** Block timestamp (Unix seconds, hex) */
	timestamp: string;
	/** Transaction hashes or full objects */
	transactions: string[] | TransactionType[];
	/** Uncle block hashes */
	uncles: string[];
	/** Base fee per gas (EIP-1559) */
	baseFeePerGas?: string;
	/** Withdrawals merkle root (EIP-4895) */
	withdrawalsRoot?: string;
	/** Blob gas used (EIP-4844) */
	blobGasUsed?: string;
	/** Excess blob gas (EIP-4844) */
	excessBlobGas?: string;
	/** Parent beacon block root */
	parentBeaconBlockRoot?: string;
}

/**
 * Ethereum transaction as returned by JSON-RPC.
 * 
 * @description
 * Supports legacy, EIP-1559, and EIP-4844 transaction types.
 * All numeric fields are hex-encoded strings.
 * 
 * @since 0.0.1
 */
export interface TransactionType {
	/** Transaction hash */
	hash: string;
	/** Sender nonce (hex) */
	nonce: string;
	/** Block hash (null if pending) */
	blockHash: string | null;
	/** Block number (null if pending, hex) */
	blockNumber: string | null;
	/** Index in block (null if pending, hex) */
	transactionIndex: string | null;
	/** Sender address */
	from: string;
	/** Recipient address (null for contract creation) */
	to: string | null;
	/** Value in wei (hex) */
	value: string;
	/** Gas price for legacy tx (hex) */
	gasPrice?: string;
	/** Gas limit (hex) */
	gas: string;
	/** Transaction input data */
	input: string;
	/** Signature v component */
	v: string;
	/** Signature r component */
	r: string;
	/** Signature s component */
	s: string;
	/** Transaction type (0=legacy, 1=EIP-2930, 2=EIP-1559, 3=EIP-4844) */
	type?: string;
	/** Max fee per gas (EIP-1559) */
	maxFeePerGas?: string;
	/** Max priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas?: string;
	/** Chain ID (hex) */
	chainId?: string;
	/** Access list (EIP-2930+) */
	accessList?: Array<{ address: string; storageKeys: string[] }>;
	/** Max fee per blob gas (EIP-4844) */
	maxFeePerBlobGas?: string;
	/** Blob versioned hashes (EIP-4844) */
	blobVersionedHashes?: string[];
}

/**
 * Transaction receipt as returned by JSON-RPC.
 * 
 * @description
 * Contains the result of a mined transaction including logs,
 * gas usage, and status.
 * 
 * @since 0.0.1
 */
export interface ReceiptType {
	/** Transaction hash */
	transactionHash: string;
	/** Index in block (hex) */
	transactionIndex: string;
	/** Block hash */
	blockHash: string;
	/** Block number (hex) */
	blockNumber: string;
	/** Sender address */
	from: string;
	/** Recipient address (null for contract creation) */
	to: string | null;
	/** Cumulative gas used in block (hex) */
	cumulativeGasUsed: string;
	/** Gas used by this transaction (hex) */
	gasUsed: string;
	/** Contract address if deployment (null otherwise) */
	contractAddress: string | null;
	/** Event logs emitted */
	logs: LogType[];
	/** Bloom filter for logs */
	logsBloom: string;
	/** Status (0x1 = success, 0x0 = failure) */
	status: string;
	/** Actual gas price paid (hex) */
	effectiveGasPrice: string;
	/** Transaction type */
	type: string;
	/** State root (pre-Byzantium) */
	root?: string;
	/** Blob gas used (EIP-4844) */
	blobGasUsed?: string;
	/** Blob gas price (EIP-4844) */
	blobGasPrice?: string;
}

/**
 * Event log as returned by JSON-RPC.
 * 
 * @description
 * Represents a single event emitted by a smart contract.
 * Topics are indexed parameters, data contains non-indexed parameters.
 * 
 * @since 0.0.1
 */
export interface LogType {
	/** Contract address that emitted the event */
	address: string;
	/** Indexed event parameters (topic[0] is event signature) */
	topics: string[];
	/** ABI-encoded non-indexed parameters */
	data: string;
	/** Block number where emitted (hex) */
	blockNumber: string;
	/** Transaction hash */
	transactionHash: string;
	/** Transaction index in block (hex) */
	transactionIndex: string;
	/** Block hash */
	blockHash: string;
	/** Log index in block (hex) */
	logIndex: string;
	/** True if log was removed due to reorg */
	removed: boolean;
}

/**
 * Access list result from eth_createAccessList.
 * 
 * @description
 * Contains the access list entries and estimated gas for using them.
 * Access lists can reduce gas costs for EIP-2930+ transactions.
 * 
 * @since 0.0.1
 */
export interface AccessListType {
	/** List of addresses and storage slots accessed */
	accessList: Array<{ address: string; storageKeys: string[] }>;
	/** Estimated gas with access list (hex) */
	gasUsed: string;
}

/**
 * Fee history result from eth_feeHistory.
 * 
 * @description
 * Historical base fee and priority fee data for gas estimation.
 * Useful for EIP-1559 transaction fee calculation.
 * 
 * @since 0.0.1
 */
export interface FeeHistoryType {
	/** Oldest block in the returned range (hex) */
	oldestBlock: string;
	/** Base fee per gas for each block (hex) */
	baseFeePerGas: string[];
	/** Ratio of gas used to gas limit per block */
	gasUsedRatio: number[];
	/** Priority fee percentiles per block (if requested) */
	reward?: string[][];
}

/**
 * Shape of the public client service.
 * 
 * @description
 * Defines all read-only blockchain operations available through PublicClientService.
 * Each method returns an Effect that may fail with PublicClientError.
 * 
 * @since 0.0.1
 */
export type PublicClientShape = {
	/** Gets the current block number */
	readonly getBlockNumber: () => Effect.Effect<bigint, PublicClientError>;
	/** Gets a block by tag or hash */
	readonly getBlock: (args?: { blockTag?: BlockTag; blockHash?: HashInput; includeTransactions?: boolean }) => Effect.Effect<BlockType, PublicClientError>;
	/** Gets the transaction count in a block */
	readonly getBlockTransactionCount: (args: { blockTag?: BlockTag; blockHash?: HashInput }) => Effect.Effect<bigint, PublicClientError>;
	/** Gets the balance of an address */
	readonly getBalance: (address: AddressInput, blockTag?: BlockTag) => Effect.Effect<bigint, PublicClientError>;
	/** Gets the transaction count (nonce) for an address */
	readonly getTransactionCount: (address: AddressInput, blockTag?: BlockTag) => Effect.Effect<bigint, PublicClientError>;
	/** Gets the bytecode at an address */
	readonly getCode: (address: AddressInput, blockTag?: BlockTag) => Effect.Effect<HexType | `0x${string}`, PublicClientError>;
	/** Gets storage at a specific slot */
	readonly getStorageAt: (address: AddressInput, slot: HashInput, blockTag?: BlockTag) => Effect.Effect<HexType | `0x${string}`, PublicClientError>;
	/** Gets a transaction by hash */
	readonly getTransaction: (hash: HashInput) => Effect.Effect<TransactionType, PublicClientError>;
	/** Gets a transaction receipt */
	readonly getTransactionReceipt: (hash: HashInput) => Effect.Effect<ReceiptType, PublicClientError>;
	/** Waits for a transaction to be confirmed */
	readonly waitForTransactionReceipt: (hash: HashInput, opts?: { confirmations?: number; timeout?: number }) => Effect.Effect<ReceiptType, PublicClientError>;
	/** Executes a call without sending a transaction */
	readonly call: (tx: CallRequest, blockTag?: BlockTag) => Effect.Effect<HexType | `0x${string}`, PublicClientError>;
	/** Estimates gas for a transaction */
	readonly estimateGas: (tx: CallRequest) => Effect.Effect<bigint, PublicClientError>;
	/** Creates an access list for a transaction */
	readonly createAccessList: (tx: CallRequest) => Effect.Effect<AccessListType, PublicClientError>;
	/** Gets logs matching the filter */
	readonly getLogs: (filter: LogFilter) => Effect.Effect<LogType[], PublicClientError>;
	/** Gets the chain ID */
	readonly getChainId: () => Effect.Effect<number, PublicClientError>;
	/** Gets the current gas price */
	readonly getGasPrice: () => Effect.Effect<bigint, PublicClientError>;
	/** Gets the max priority fee per gas (EIP-1559) */
	readonly getMaxPriorityFeePerGas: () => Effect.Effect<bigint, PublicClientError>;
	/** Gets fee history for gas estimation */
	readonly getFeeHistory: (blockCount: number, newestBlock: BlockTag, rewardPercentiles: number[]) => Effect.Effect<FeeHistoryType, PublicClientError>;
};

/**
 * Public client service for read-only blockchain operations.
 * 
 * @description
 * Provides methods for querying blocks, transactions, balances, and more.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (PublicClient layer) before running.
 * 
 * The service provides all standard Ethereum JSON-RPC read methods:
 * - Block queries (getBlock, getBlockNumber, getBlockTransactionCount)
 * - Account queries (getBalance, getTransactionCount, getCode, getStorageAt)
 * - Transaction queries (getTransaction, getTransactionReceipt, waitForTransactionReceipt)
 * - Call simulation (call, estimateGas, createAccessList)
 * - Event queries (getLogs)
 * - Network info (getChainId, getGasPrice, getMaxPriorityFeePerGas, getFeeHistory)
 * 
 * Requires TransportService to be provided for actual RPC communication.
 * 
 * @since 0.0.1
 * 
 * @example Basic usage with HttpTransport
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, PublicClient, HttpTransport } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   const blockNum = yield* client.getBlockNumber()
 *   const balance = yield* client.getBalance('0x1234...')
 *   return { blockNum, balance }
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * 
 * await Effect.runPromise(program)
 * ```
 * 
 * @example Querying block and transaction data
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, PublicClient, HttpTransport } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   
 *   // Get latest block with full transactions
 *   const block = yield* client.getBlock({ 
 *     blockTag: 'latest', 
 *     includeTransactions: true 
 *   })
 *   
 *   // Get specific transaction
 *   const tx = yield* client.getTransaction('0x...')
 *   
 *   // Wait for transaction confirmation
 *   const receipt = yield* client.waitForTransactionReceipt('0x...', {
 *     confirmations: 3,
 *     timeout: 60000
 *   })
 *   
 *   return { block, tx, receipt }
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * 
 * @example Contract interaction (read-only)
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, PublicClient, HttpTransport } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   
 *   // Call a view function
 *   const result = yield* client.call({
 *     to: '0x1234...',
 *     data: '0x...' // encoded function call
 *   })
 *   
 *   // Estimate gas for a transaction
 *   const gasEstimate = yield* client.estimateGas({
 *     to: '0x1234...',
 *     data: '0x...',
 *     value: 1000000000000000000n // 1 ETH
 *   })
 *   
 *   return { result, gasEstimate }
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * 
 * @example Querying event logs
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, PublicClient, HttpTransport } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   
 *   // Get Transfer events from a token contract
 *   const logs = yield* client.getLogs({
 *     address: '0x1234...',
 *     topics: ['0xddf252ad...'], // Transfer event signature
 *     fromBlock: '0x100000',
 *     toBlock: 'latest'
 *   })
 *   
 *   return logs
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * 
 * @see {@link PublicClient} - The live implementation layer
 * @see {@link PublicClientShape} - The service interface shape
 * @see {@link PublicClientError} - Error type for failed operations
 * @see {@link TransportService} - Required dependency for RPC communication
 */
export class PublicClientService extends Context.Tag("PublicClientService")<
	PublicClientService,
	PublicClientShape
>() {}
