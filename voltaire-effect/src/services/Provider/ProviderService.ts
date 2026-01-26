/**
 * @fileoverview Provider service definition for read-only blockchain operations.
 *
 * @module ProviderService
 * @since 0.0.1
 *
 * @description
 * The ProviderService provides a high-level interface for querying Ethereum
 * blockchain data. It abstracts away the underlying JSON-RPC details and provides
 * type-safe methods for common operations like getting balances, blocks, and transactions.
 *
 * All methods are read-only and do not require signing or wallet access.
 * For write operations (sending transactions), use SignerService.
 *
 * The service requires a TransportService to be provided for actual RPC communication.
 *
 * @see {@link Provider} - The live implementation layer
 * @see {@link SignerService} - For write operations
 * @see {@link TransportService} - The underlying transport layer
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type {
	BackfillOptions,
	BlockInclude,
	BlocksEvent,
	BlockStreamEvent,
	WatchOptions,
} from "@tevm/voltaire/block";
import type { HashType } from "@tevm/voltaire/Hash";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type * as Stream from "effect/Stream";

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
 * Filter identifier returned by eth_newFilter methods.
 *
 * @since 0.0.1
 */
export type FilterId = `0x${string}`;


/**
 * Error thrown when a provider operation fails.
 *
 * @description
 * Contains the original input and optional cause for debugging.
 * All ProviderService methods may fail with this error type.
 *
 * Common failure reasons:
 * - Network connectivity issues
 * - Invalid parameters (bad address, block not found)
 * - RPC node errors
 * - Rate limiting
 *
 * @since 0.0.1
 *
 * @example Creating a ProviderError
 * ```typescript
 * const error = new ProviderError(
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
 * @example Handling ProviderError in Effect
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, ProviderError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBalance('0x...')
 * }).pipe(
 *   Effect.catchTag('ProviderError', (error) => {
 *     console.error('Failed:', error.message, 'Input:', error.input)
 *     return Effect.succeed(0n)
 *   })
 * )
 * ```
 */
export class ProviderError extends Data.TaggedError("ProviderError")<{
	/**
	 * The original input that caused the error.
	 */
	readonly input: unknown;

	/**
	 * Human-readable error message.
	 */
	readonly message: string;

	/**
	 * JSON-RPC error code (propagated from transport).
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
	 * Creates a new ProviderError.
	 *
	 * @param input - The original input that caused the error (method, params, etc.)
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
			message: message ?? options?.cause?.message ?? "Provider error",
			code: options?.code,
			cause: options?.cause,
			context: options?.context,
		});
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
 * const balance1 = yield* provider.getBalance(address, 'latest')
 * const balance2 = yield* provider.getBalance(address, 'finalized')
 *
 * // Using hex block number
 * const balance3 = yield* provider.getBalance(address, '0x1234')
 * ```
 */
export type BlockTag =
	| "latest"
	| "earliest"
	| "pending"
	| "safe"
	| "finalized"
	| `0x${string}`;

/**
 * State override for a single account.
 *
 * @description
 * Allows modifying account state before executing eth_call or eth_estimateGas.
 * Useful for simulating transactions with modified balances, code, or storage.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const override: AccountStateOverride = {
 *   balance: 1000000000000000000n,  // Override balance to 1 ETH
 *   nonce: 5n,                       // Override nonce
 *   code: '0x6080604052...',         // Replace contract code
 *   state: {                         // Replace entire storage
 *     '0x0000...0000': '0x0000...0001'
 *   },
 *   stateDiff: {                     // Merge with existing storage
 *     '0x0000...0001': '0x0000...0064'
 *   }
 * }
 * ```
 */
export interface AccountStateOverride {
	/** Override balance in wei */
	readonly balance?: bigint;
	/** Override nonce */
	readonly nonce?: bigint;
	/** Override contract bytecode */
	readonly code?: HexType | `0x${string}`;
	/** Replace entire storage with this mapping (slot -> value) */
	readonly state?: Record<`0x${string}`, `0x${string}`>;
	/** Merge these slots with existing storage (slot -> value) */
	readonly stateDiff?: Record<`0x${string}`, `0x${string}`>;
}

/**
 * State override set mapping addresses to account overrides.
 *
 * @description
 * Maps account addresses to their state overrides. Each address can have
 * its balance, nonce, code, and storage modified for the duration of the call.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const stateOverride: StateOverride = {
 *   '0x1234...': { balance: 1000000000000000000n },
 *   '0x5678...': { code: '0x6080604052...' }
 * }
 * ```
 */
export type StateOverride = Record<`0x${string}`, AccountStateOverride>;

/**
 * Block overrides for call simulation.
 *
 * @description
 * Allows overriding block context during eth_call execution.
 * Useful for simulating calls at different block conditions.
 *
 * @since 0.0.1
 */
export interface BlockOverrides {
	/** Override block number */
	readonly number?: bigint;
	/** Override block difficulty */
	readonly difficulty?: bigint;
	/** Override block time (unix timestamp) */
	readonly time?: bigint;
	/** Override gas limit */
	readonly gasLimit?: bigint;
	/** Override coinbase/miner address */
	readonly coinbase?: AddressInput;
	/** Override random/prevrandao */
	readonly random?: HashInput;
	/** Override base fee */
	readonly baseFee?: bigint;
}

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
 * Arguments for getBlock - discriminated union to prevent invalid combinations.
 *
 * @description
 * Either query by blockTag OR by blockHash, never both.
 *
 * @since 0.0.1
 */
export type GetBlockArgs =
	| {
			/** Block tag (latest, earliest, pending, safe, finalized, or hex number) */
			blockTag?: BlockTag;
			/** Whether to include full transaction objects */
			includeTransactions?: boolean;
			blockHash?: never;
			blockNumber?: never;
	  }
	| {
			/** Block hash to query */
			blockHash: HashInput;
			/** Whether to include full transaction objects */
			includeTransactions?: boolean;
			blockTag?: never;
			blockNumber?: never;
	  }
	| {
			/** Block number as bigint */
			blockNumber: bigint;
			/** Whether to include full transaction objects */
			includeTransactions?: boolean;
			blockTag?: never;
			blockHash?: never;
	  };

/**
 * Arguments for getBlockTransactionCount - discriminated union.
 *
 * @description
 * Either query by blockTag OR by blockHash, never both.
 *
 * @since 0.0.1
 */
export type GetBlockTransactionCountArgs =
	| {
			/** Block tag (latest, earliest, pending, safe, finalized, or hex number) */
			blockTag?: BlockTag;
			blockHash?: never;
	  }
	| {
			/** Block hash to query */
			blockHash: HashInput;
			blockTag?: never;
	  };

/**
 * Filter parameters for eth_getLogs - discriminated union.
 *
 * @description
 * Defines the criteria for querying event logs from contracts.
 * Either use blockHash OR fromBlock/toBlock range, never both.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * // Get all Transfer events from a token contract by block range
 * const filter: LogFilter = {
 *   address: '0x1234...',
 *   topics: ['0xddf252ad...'], // Transfer event signature
 *   fromBlock: 'latest',
 *   toBlock: 'latest'
 * }
 *
 * // Get events by block hash
 * const filter2: LogFilter = {
 *   address: '0x1234...',
 *   blockHash: '0xabc...'
 * }
 * ```
 */
export type LogFilter =
	| {
			/** Specific block hash (mutually exclusive with fromBlock/toBlock) */
			blockHash: HashInput;
			fromBlock?: never;
			toBlock?: never;
			/** Contract address(es) to filter (single or array) */
			address?: AddressInput | AddressInput[];
			/** Topic filters by position (null for wildcard at that position) */
			topics?: (HashInput | HashInput[] | null)[];
	  }
	| {
			blockHash?: never;
			/** Start block for range query (inclusive) */
			fromBlock?: BlockTag;
			/** End block for range query (inclusive) */
			toBlock?: BlockTag;
			/** Contract address(es) to filter (single or array) */
			address?: AddressInput | AddressInput[];
			/** Topic filters by position (null for wildcard at that position) */
			topics?: (HashInput | HashInput[] | null)[];
	  };

/**
 * Filter parameters for eth_newFilter.
 *
 * @description
 * Defines the criteria for creating an event log filter.
 *
 * @since 0.0.1
 */
export type EventFilter = {
	/** Contract address(es) to filter (single or array) */
	readonly address?: AddressInput | AddressInput[];
	/** Topic filters by position (null for wildcard at that position) */
	readonly topics?: (HashInput | HashInput[] | null)[];
	/** Start block for range query (inclusive) */
	readonly fromBlock?: BlockTag;
	/** End block for range query (inclusive) */
	readonly toBlock?: BlockTag;
};

/**
 * Filter parameters for eth_newFilter (event filters).
 *
 * @description
 * Matches a subset of LogFilter parameters used for creating an event filter.
 *
 * @since 0.0.1
 */
export type EventFilter = {
	/** Contract address(es) to filter (single or array) */
	address?: AddressInput | AddressInput[];
	/** Topic filters by position (null for wildcard at that position) */
	topics?: (HashInput | HashInput[] | null)[];
	/** Start block for range query (inclusive) */
	fromBlock?: BlockTag;
	/** End block for range query (inclusive) */
	toBlock?: BlockTag;
};

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
	/** Block number (hex-encoded) - null for pending blocks */
	number: string | null;
	/** Block hash - null for pending blocks */
	hash: string | null;
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
	/** Maximum gas allowed in block (hex) */
	gasLimit: string;
	/** Total gas used by transactions (hex) */
	gasUsed: string;
	/** Block timestamp (hex, unix seconds) */
	timestamp: string;
	/** Transaction hashes or full transaction objects */
	transactions: string[] | TransactionType[];
	/** Uncle block hashes */
	uncles: string[];
	/** Base fee per gas (EIP-1559, hex) */
	baseFeePerGas?: string;
	/** Withdrawals (EIP-4895) */
	withdrawals?: WithdrawalType[];
	/** Withdrawals root (EIP-4895) */
	withdrawalsRoot?: string;
	/** Blob gas used (EIP-4844, hex) */
	blobGasUsed?: string;
	/** Excess blob gas (EIP-4844, hex) */
	excessBlobGas?: string;
	/** Parent beacon block root (EIP-4788, hex) */
	parentBeaconBlockRoot?: string;
}

/**
 * Withdrawal object (EIP-4895).
 *
 * @since 0.0.1
 */
export interface WithdrawalType {
	/** Withdrawal index (hex) */
	index: string;
	/** Validator index (hex) */
	validatorIndex: string;
	/** Recipient address */
	address: string;
	/** Amount in Gwei (hex) */
	amount: string;
}

/**
 * Ethereum transaction as returned by JSON-RPC.
 *
 * @description
 * Contains all transaction fields. Type determines which fee fields are present.
 * All numeric fields are hex-encoded strings.
 *
 * @since 0.0.1
 */
export interface TransactionType {
	/** Transaction hash */
	hash: string;
	/** Sender's transaction count at send time (hex) */
	nonce: string;
	/** Block hash (null if pending) */
	blockHash: string | null;
	/** Block number (hex, null if pending) */
	blockNumber: string | null;
	/** Index in block (hex, null if pending) */
	transactionIndex: string | null;
	/** Sender address */
	from: string;
	/** Recipient address (null for contract creation) */
	to: string | null;
	/** Value in wei (hex) */
	value: string;
	/** Gas limit (hex) */
	gas: string;
	/** Gas price in wei (hex, legacy) */
	gasPrice?: string;
	/** Max fee per gas (hex, EIP-1559) */
	maxFeePerGas?: string;
	/** Max priority fee per gas (hex, EIP-1559) */
	maxPriorityFeePerGas?: string;
	/** Input data (hex) */
	input: string;
	/** v component of signature (hex) */
	v?: string;
	/** r component of signature (hex) */
	r?: string;
	/** s component of signature (hex) */
	s?: string;
	/** Transaction type (hex: 0x0=legacy, 0x1=2930, 0x2=1559) */
	type?: string;
	/** Access list (EIP-2930) */
	accessList?: Array<{ address: string; storageKeys: string[] }>;
	/** Chain ID (hex) */
	chainId?: string;
	/** Max fee per blob gas (EIP-4844, hex) */
	maxFeePerBlobGas?: string;
	/** Blob versioned hashes (EIP-4844) */
	blobVersionedHashes?: string[];
	/** y parity for EIP-2930+ (hex) */
	yParity?: string;
}

/**
 * Transaction receipt as returned by JSON-RPC.
 *
 * @description
 * Contains the result of transaction execution including status,
 * gas used, and generated logs.
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
	/** Cumulative gas used in block up to this tx (hex) */
	cumulativeGasUsed: string;
	/** Gas used by this transaction (hex) */
	gasUsed: string;
	/** Effective gas price paid (hex) */
	effectiveGasPrice?: string;
	/** Contract address created (null if not contract creation) */
	contractAddress: string | null;
	/** Event logs emitted */
	logs: LogType[];
	/** Bloom filter for logs */
	logsBloom: string;
	/** Transaction type (hex) */
	type?: string;
	/** Success status (hex: 0x1=success, 0x0=failure) */
	status: string;
}

/**
 * Event log as returned by JSON-RPC.
 *
 * @description
 * Represents an event emitted by a smart contract.
 * Topics contain indexed event parameters.
 *
 * @since 0.0.1
 */
export interface LogType {
	/** Contract that emitted the log */
	address: string;
	/** Indexed event parameters (first is event signature) */
	topics: string[];
	/** Non-indexed event data (hex) */
	data: string;
	/** Block number (hex) */
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
 * Filter changes returned by eth_getFilterChanges.
 *
 * @since 0.0.1
 */
export type FilterChanges = LogType[] | `0x${string}`[];

/**
 * Result type for eth_getFilterChanges.
 *
 * @description
 * Returns logs for event filters or hashes for block/transaction filters.
 *
 * @since 0.0.1
 */
export type FilterChanges = LogType[] | `0x${string}`[];

/**
 * Access list result from eth_createAccessList.
 *
 * @description
 * Contains the generated access list and estimated gas.
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
 * Storage proof for a single slot.
 *
 * @since 0.0.1
 */
export interface StorageProofType {
	/** Storage slot key (hex) */
	key: string;
	/** Value at slot (hex) */
	value: string;
	/** Merkle proof nodes (array of hex) */
	proof: string[];
}

/**
 * Account proof result from eth_getProof.
 *
 * @description
 * Contains the Merkle-Patricia proof for an account and optional storage slots.
 * Useful for stateless verification and light client implementations.
 *
 * @since 0.0.1
 */
export interface ProofType {
	/** Account address */
	address: string;
	/** Merkle proof nodes for account (array of hex) */
	accountProof: string[];
	/** Account balance (hex) */
	balance: string;
	/** Account code hash */
	codeHash: string;
	/** Account nonce (hex) */
	nonce: string;
	/** Storage trie root hash */
	storageHash: string;
	/** Storage proofs for requested slots */
	storageProof: StorageProofType[];
}

/**
 * Uncle block type (partial block without transactions).
 *
 * @since 0.0.1
 */
export interface UncleBlockType {
	/** Block number (hex) - null for pending blocks */
	number: string | null;
	/** Block hash - null for pending blocks */
	hash: string | null;
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
	/** Maximum gas allowed in block (hex) */
	gasLimit: string;
	/** Total gas used by transactions (hex) */
	gasUsed: string;
	/** Block timestamp (hex, unix seconds) */
	timestamp: string;
	/** Uncle block hashes */
	uncles: string[];
}

/**
 * Arguments for getUncle - either by block tag or block hash.
 *
 * @since 0.0.1
 */
export type GetUncleArgs =
	| {
			/** Block tag (latest, earliest, pending, safe, finalized, or hex number) */
			blockTag?: BlockTag;
			blockHash?: never;
	  }
	| {
			/** Block hash to query */
			blockHash: HashInput;
			blockTag?: never;
	  };

/**
 * Shape of the provider service.
 *
 * @description
 * Defines all read-only blockchain operations available through ProviderService.
 * Each method returns an Effect that may fail with ProviderError.
 *
 * @since 0.0.1
 */
export type ProviderShape = {
	/** Gets the current block number */
	readonly getBlockNumber: () => Effect.Effect<bigint, ProviderError>;
	/** Gets a block by tag or hash */
	readonly getBlock: (
		args?: GetBlockArgs,
	) => Effect.Effect<BlockType, ProviderError>;
	/** Gets the transaction count in a block */
	readonly getBlockTransactionCount: (
		args: GetBlockTransactionCountArgs,
	) => Effect.Effect<bigint, ProviderError>;
	/** Gets the balance of an address */
	readonly getBalance: (
		address: AddressInput,
		blockTag?: BlockTag,
	) => Effect.Effect<bigint, ProviderError>;
	/** Gets the transaction count (nonce) for an address */
	readonly getTransactionCount: (
		address: AddressInput,
		blockTag?: BlockTag,
	) => Effect.Effect<bigint, ProviderError>;
	/** Gets the bytecode at an address */
	readonly getCode: (
		address: AddressInput,
		blockTag?: BlockTag,
	) => Effect.Effect<HexType | `0x${string}`, ProviderError>;
	/** Gets storage at a specific slot */
	readonly getStorageAt: (
		address: AddressInput,
		slot: HashInput,
		blockTag?: BlockTag,
	) => Effect.Effect<HexType | `0x${string}`, ProviderError>;
	/** Gets a transaction by hash */
	readonly getTransaction: (
		hash: HashInput,
	) => Effect.Effect<TransactionType, ProviderError>;
	/** Gets a transaction receipt */
	readonly getTransactionReceipt: (
		hash: HashInput,
	) => Effect.Effect<ReceiptType, ProviderError>;
	/** Waits for a transaction to be confirmed */
	readonly waitForTransactionReceipt: (
		hash: HashInput,
		opts?: {
			confirmations?: number;
			timeout?: number;
			pollingInterval?: number;
		},
	) => Effect.Effect<ReceiptType, ProviderError>;
	/** Executes a call without sending a transaction */
	readonly call: (
		tx: CallRequest,
		blockTag?: BlockTag,
		stateOverride?: StateOverride,
		blockOverrides?: BlockOverrides,
	) => Effect.Effect<HexType | `0x${string}`, ProviderError>;
	/** Estimates gas for a transaction */
	readonly estimateGas: (
		tx: CallRequest,
		blockTag?: BlockTag,
		stateOverride?: StateOverride,
	) => Effect.Effect<bigint, ProviderError>;
	/** Creates an access list for a transaction */
	readonly createAccessList: (
		tx: CallRequest,
	) => Effect.Effect<AccessListType, ProviderError>;
	/** Gets logs matching the filter */
	readonly getLogs: (
		filter: LogFilter,
	) => Effect.Effect<LogType[], ProviderError>;
	/** Creates an event filter (eth_newFilter) */
	readonly createEventFilter: (
		filter?: EventFilter,
	) => Effect.Effect<FilterId, ProviderError>;
	/** Creates a new block filter (eth_newBlockFilter) */
	readonly createBlockFilter: () => Effect.Effect<FilterId, ProviderError>;
	/** Creates a pending transaction filter (eth_newPendingTransactionFilter) */
	readonly createPendingTransactionFilter: () => Effect.Effect<
		FilterId,
		ProviderError
	>;
	/** Gets changes since last poll for a filter (eth_getFilterChanges) */
	readonly getFilterChanges: (
		filterId: FilterId,
	) => Effect.Effect<FilterChanges, ProviderError>;
	/** Gets all logs for a filter (eth_getFilterLogs) */
	readonly getFilterLogs: (
		filterId: FilterId,
	) => Effect.Effect<LogType[], ProviderError>;
	/** Uninstalls a filter (eth_uninstallFilter) */
	readonly uninstallFilter: (
		filterId: FilterId,
	) => Effect.Effect<boolean, ProviderError>;
	/** Gets the chain ID */
	readonly getChainId: () => Effect.Effect<number, ProviderError>;
	/** Gets the current gas price */
	readonly getGasPrice: () => Effect.Effect<bigint, ProviderError>;
	/** Gets the max priority fee per gas (EIP-1559) */
	readonly getMaxPriorityFeePerGas: () => Effect.Effect<bigint, ProviderError>;
	/** Gets fee history for gas estimation */
	readonly getFeeHistory: (
		blockCount: number,
		newestBlock: BlockTag,
		rewardPercentiles: number[],
	) => Effect.Effect<FeeHistoryType, ProviderError>;
	/** Watch for new blocks with reorg detection */
	readonly watchBlocks: <TInclude extends BlockInclude = "header">(
		options?: WatchOptions<TInclude>,
	) => Stream.Stream<BlockStreamEvent<TInclude>, ProviderError>;
	/** Backfill historical blocks */
	readonly backfillBlocks: <TInclude extends BlockInclude = "header">(
		options: BackfillOptions<TInclude>,
	) => Stream.Stream<BlocksEvent<TInclude>, ProviderError>;
	/** Sends a signed raw transaction */
	readonly sendRawTransaction: (
		signedTx: HexType | `0x${string}`,
	) => Effect.Effect<`0x${string}`, ProviderError>;
	/** Gets an uncle block by block identifier and index */
	readonly getUncle: (
		args: GetUncleArgs,
		uncleIndex: `0x${string}`,
	) => Effect.Effect<UncleBlockType, ProviderError>;
	/** Gets Merkle-Patricia proof for an account and storage slots */
	readonly getProof: (
		address: AddressInput,
		storageKeys: (HashInput | `0x${string}`)[],
		blockTag?: BlockTag,
	) => Effect.Effect<ProofType, ProviderError>;
	/** Gets the blob base fee (EIP-4844) */
	readonly getBlobBaseFee: () => Effect.Effect<bigint, ProviderError>;
	/** Gets the number of confirmations for a transaction */
	readonly getTransactionConfirmations: (
		hash: HashInput,
	) => Effect.Effect<bigint, ProviderError>;
};

/**
 * Provider service for read-only blockchain operations.
 *
 * @description
 * Provides methods for querying blocks, transactions, balances, and more.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (Provider layer) before running.
 *
 * The service provides all standard Ethereum JSON-RPC read methods:
 * - Block queries (getBlock, getBlockNumber, getBlockTransactionCount)
 * - Account queries (getBalance, getTransactionCount, getCode, getStorageAt)
 * - Transaction queries (getTransaction, getTransactionReceipt, waitForTransactionReceipt)
 * - Call simulation (call, estimateGas, createAccessList)
 * - Event queries (getLogs)
 * - Filter subscriptions (createEventFilter, createBlockFilter, createPendingTransactionFilter, getFilterChanges, getFilterLogs, uninstallFilter)
 * - Network info (getChainId, getGasPrice, getMaxPriorityFeePerGas, getFeeHistory)
 *
 * Requires TransportService to be provided for actual RPC communication.
 *
 * @since 0.0.1
 *
 * @example Basic usage with HttpTransport
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   const blockNum = yield* provider.getBlockNumber()
 *   const balance = yield* provider.getBalance('0x1234...')
 *   return { blockNum, balance }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example Querying block and transaction data
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *
 *   // Get latest block with full transactions
 *   const block = yield* provider.getBlock({
 *     blockTag: 'latest',
 *     includeTransactions: true
 *   })
 *
 *   // Get specific transaction
 *   const tx = yield* provider.getTransaction('0x...')
 *
 *   // Wait for transaction confirmation
 *   const receipt = yield* provider.waitForTransactionReceipt('0x...', {
 *     confirmations: 3,
 *     timeout: 60000
 *   })
 *
 *   return { block, tx, receipt }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example Contract interaction (read-only)
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *
 *   // Call a view function
 *   const result = yield* provider.call({
 *     to: '0x1234...',
 *     data: '0x...' // encoded function call
 *   })
 *
 *   // Estimate gas for a transaction
 *   const gasEstimate = yield* provider.estimateGas({
 *     to: '0x1234...',
 *     data: '0x...',
 *     value: 1000000000000000000n // 1 ETH
 *   })
 *
 *   return { result, gasEstimate }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example Querying event logs
 * ```typescript
 * import { Effect } from 'effect'
 * import { ProviderService, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *
 *   // Get Transfer events from a token contract
 *   const logs = yield* provider.getLogs({
 *     address: '0x1234...',
 *     topics: ['0xddf252ad...'], // Transfer event signature
 *     fromBlock: '0x100000',
 *     toBlock: 'latest'
 *   })
 *
 *   return logs
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link Provider} - The live implementation layer
 * @see {@link ProviderShape} - The service interface shape
 * @see {@link ProviderError} - Error type for failed operations
 * @see {@link TransportService} - Required dependency for RPC communication
 */
export class ProviderService extends Context.Tag("ProviderService")<
	ProviderService,
	ProviderShape
>() {}
