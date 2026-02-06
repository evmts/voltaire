/**
 * @fileoverview Type definitions for Provider service.
 *
 * @module Provider/types
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Data from "effect/Data";
import type { TransportError } from "../Transport/TransportError.js";

// Re-export BlockStream types for convenience
export type {
	BackfillOptions,
	BlockInclude,
	BlockStreamEvent,
	BlocksEvent,
	WatchOptions,
} from "@tevm/voltaire/block";

/**
 * Address input type that accepts both branded AddressType and plain hex strings.
 */
export type AddressInput = AddressType | `0x${string}`;

/**
 * Hash input type that accepts both branded HashType and plain hex strings.
 */
export type HashInput = HashType | `0x${string}`;

/**
 * Transaction index input type for block transaction lookups.
 */
export type TransactionIndexInput = number | bigint | `0x${string}`;

/**
 * Filter identifier returned by eth_newFilter methods.
 */
export type FilterId = `0x${string}`;

/**
 * Block identifier for Ethereum RPC calls.
 */
export type BlockTag =
	| "latest"
	| "earliest"
	| "pending"
	| "safe"
	| "finalized"
	| `0x${string}`;

/**
 * Error thrown when the provider returns an invalid or unexpected response.
 */
export class ProviderResponseError extends Data.TaggedError(
	"ProviderResponseError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			input,
			message:
				message ??
				(options?.cause instanceof Error ? options.cause.message : undefined) ??
				"Invalid provider response",
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Error thrown when a requested resource is missing (block, tx, receipt, etc.).
 */
export class ProviderNotFoundError extends Data.TaggedError(
	"ProviderNotFoundError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly resource?: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: {
			resource?: string;
			cause?: unknown;
			context?: Record<string, unknown>;
		},
	) {
		super({
			input,
			message: message ?? "Resource not found",
			resource: options?.resource,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Error thrown when inputs fail validation before an RPC call is made.
 */
export class ProviderValidationError extends Data.TaggedError(
	"ProviderValidationError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			input,
			message:
				message ??
				(options?.cause instanceof Error ? options.cause.message : undefined) ??
				"Invalid provider input",
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Error thrown when waiting for a result exceeds a timeout.
 */
export class ProviderTimeoutError extends Data.TaggedError(
	"ProviderTimeoutError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly timeoutMs?: number;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: {
			timeoutMs?: number;
			cause?: unknown;
			context?: Record<string, unknown>;
		},
	) {
		super({
			input,
			message: message ?? "Provider operation timed out",
			timeoutMs: options?.timeoutMs,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Error thrown by provider streams (watch/backfill).
 */
export class ProviderStreamError extends Data.TaggedError(
	"ProviderStreamError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			input,
			message:
				message ??
				(options?.cause instanceof Error ? options.cause.message : undefined) ??
				"Provider stream error",
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Error used internally while waiting for a transaction receipt.
 */
export class ProviderReceiptPendingError extends Data.TaggedError(
	"ProviderReceiptPendingError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			input,
			message: message ?? "Transaction pending",
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Error used internally while waiting for confirmation depth.
 */
export class ProviderConfirmationsPendingError extends Data.TaggedError(
	"ProviderConfirmationsPendingError",
)<{
	readonly input: unknown;
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			input,
			message: message ?? "Waiting for confirmations",
			cause: options?.cause,
			context: options?.context,
		});
	}
}

/**
 * Union of all provider-specific errors (excludes TransportError).
 */
export type ProviderError =
	| ProviderResponseError
	| ProviderNotFoundError
	| ProviderValidationError
	| ProviderTimeoutError
	| ProviderStreamError
	| ProviderReceiptPendingError
	| ProviderConfirmationsPendingError;

// Error type aliases for method-specific errors
export type GetBlockNumberError = TransportError | ProviderResponseError;
export type GetBlockError = TransportError | ProviderNotFoundError;
export type GetBlockTransactionCountError =
	| TransportError
	| ProviderResponseError;
export type GetBalanceError = TransportError | ProviderResponseError;
export type GetTransactionCountError = TransportError | ProviderResponseError;
export type GetCodeError = TransportError;
export type GetStorageAtError = TransportError;
export type GetTransactionError = TransportError | ProviderNotFoundError;
export type GetTransactionReceiptError = TransportError | ProviderNotFoundError;
export type WaitForTransactionReceiptError =
	| TransportError
	| ProviderNotFoundError
	| ProviderValidationError
	| ProviderTimeoutError
	| ProviderResponseError
	| ProviderReceiptPendingError
	| ProviderConfirmationsPendingError;
export type CallError = TransportError;
export type EstimateGasError = TransportError | ProviderResponseError;
export type CreateAccessListError = TransportError;
export type GetLogsError = TransportError;
export type CreateEventFilterError = TransportError;
export type CreateBlockFilterError = TransportError;
export type CreatePendingTransactionFilterError = TransportError;
export type GetFilterChangesError = TransportError;
export type GetFilterLogsError = TransportError;
export type UninstallFilterError = TransportError;
export type GetChainIdError =
	| TransportError
	| ProviderResponseError
	| ProviderValidationError;
export type GetGasPriceError = TransportError | ProviderResponseError;
export type GetMaxPriorityFeePerGasError =
	| TransportError
	| ProviderResponseError;
export type GetFeeHistoryError = TransportError | ProviderValidationError;
export type WatchBlocksError = TransportError | ProviderStreamError;
export type BackfillBlocksError = TransportError | ProviderStreamError;
export type SendRawTransactionError = TransportError;
export type GetUncleError = TransportError | ProviderNotFoundError;
export type GetProofError = TransportError;
export type GetBlobBaseFeeError =
	| TransportError
	| ProviderResponseError
	| ProviderNotFoundError;
export type GetTransactionConfirmationsError =
	| TransportError
	| ProviderResponseError;
export type GetBlockReceiptsError = TransportError | ProviderNotFoundError;
export type GetUncleCountError = TransportError | ProviderResponseError;
export type GetTransactionByBlockHashAndIndexError =
	| TransportError
	| ProviderNotFoundError;
export type GetTransactionByBlockNumberAndIndexError =
	| TransportError
	| ProviderNotFoundError;
export type SendTransactionError = TransportError;
export type SignError = TransportError;
export type SignTransactionError = TransportError;
export type SimulateV1Error = TransportError;
export type SimulateV2Error = TransportError;

/**
 * Single block simulation input for eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1BlockCall {
	readonly blockOverrides?: BlockOverrides;
	readonly stateOverrides?: StateOverride;
	readonly calls: readonly CallRequest[];
}

/**
 * Payload for eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1Payload {
	readonly blockStateCalls: readonly SimulateV1BlockCall[];
	readonly traceTransfers?: boolean;
	readonly validation?: boolean;
	readonly returnFullTransactions?: boolean;
}

/**
 * Call result from eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1CallResult {
	readonly status: `0x${string}`;
	readonly returnData: `0x${string}`;
	readonly gasUsed: `0x${string}`;
	readonly logs?: LogType[];
	readonly error?: { code?: number; message?: string };
}

/**
 * Simulated block result from eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1BlockResult {
	readonly baseFeePerGas?: `0x${string}`;
	readonly blobGasUsed?: `0x${string}`;
	readonly calls: SimulateV1CallResult[];
	readonly gasLimit?: `0x${string}`;
	readonly gasUsed?: `0x${string}`;
	readonly hash?: `0x${string}`;
	readonly number?: `0x${string}`;
	readonly timestamp?: `0x${string}`;
}

/**
 * Result type for eth_simulateV1.
 *
 * @since 0.3.0
 */
export type SimulateV1Result = SimulateV1BlockResult[];

/**
 * Payload for eth_simulateV2 (draft / evolving).
 *
 * @since 0.3.0
 */
export type SimulateV2Payload = Record<string, unknown>;

/**
 * Result type for eth_simulateV2 (draft / evolving).
 *
 * @since 0.3.0
 */
export type SimulateV2Result = unknown;
export type GetSyncingError = TransportError;
export type GetAccountsError = TransportError;
export type GetCoinbaseError = TransportError;
export type NetVersionError = TransportError;
export type SubscribeError = TransportError;
export type UnsubscribeError = TransportError;
export type GetProtocolVersionError = TransportError;
export type GetMiningError = TransportError;
export type GetHashrateError = TransportError | ProviderResponseError;
export type GetWorkError = TransportError;
export type SubmitWorkError = TransportError;
export type SubmitHashrateError = TransportError;

/**
 * State override for a single account.
 */
export interface AccountStateOverride {
	readonly balance?: bigint;
	readonly nonce?: bigint;
	readonly code?: HexType | `0x${string}`;
	readonly state?: Record<`0x${string}`, `0x${string}`>;
	readonly stateDiff?: Record<`0x${string}`, `0x${string}`>;
}

/**
 * State override set mapping addresses to account overrides.
 */
export type StateOverride = Record<`0x${string}`, AccountStateOverride>;

/**
 * Block overrides for call simulation.
 */
export interface BlockOverrides {
	readonly number?: bigint;
	readonly difficulty?: bigint;
	readonly time?: bigint;
	readonly gasLimit?: bigint;
	readonly coinbase?: AddressInput;
	readonly random?: HashInput;
	readonly baseFee?: bigint;
}

/**
 * Request parameters for eth_call and eth_estimateGas.
 */
export interface CallRequest {
	readonly to?: AddressInput;
	readonly from?: AddressInput;
	readonly data?: HexType | `0x${string}`;
	readonly value?: bigint;
	readonly gas?: bigint;
}

/**
 * Access list input for EIP-2930+ transactions.
 */
export type AccessListInput = Array<{
	address: AddressInput;
	storageKeys: Array<`0x${string}`>;
}>;

/**
 * JSON-RPC transaction request for eth_sendTransaction / eth_signTransaction.
 */
export type RpcTransactionRequest = Omit<CallRequest, "from" | "to"> & {
	readonly from: AddressInput;
	readonly to?: AddressInput | null;
	readonly gasPrice?: bigint;
	readonly maxFeePerGas?: bigint;
	readonly maxPriorityFeePerGas?: bigint;
	readonly nonce?: bigint;
	readonly accessList?: AccessListInput;
	readonly chainId?: bigint;
	readonly type?: 0 | 1 | 2 | 3 | 4;
	readonly maxFeePerBlobGas?: bigint;
	readonly blobVersionedHashes?: readonly `0x${string}`[];
};

/**
 * Arguments for getBlock - discriminated union.
 */
export type GetBlockArgs =
	| {
			blockTag?: BlockTag;
			includeTransactions?: boolean;
			blockHash?: never;
			blockNumber?: never;
	  }
	| {
			blockHash: HashInput;
			includeTransactions?: boolean;
			blockTag?: never;
			blockNumber?: never;
	  }
	| {
			blockNumber: bigint;
			includeTransactions?: boolean;
			blockTag?: never;
			blockHash?: never;
	  };

/**
 * Arguments for getBlockReceipts.
 */
export type GetBlockReceiptsArgs =
	| {
			blockTag?: BlockTag;
			blockHash?: never;
			blockNumber?: never;
	  }
	| {
			blockHash: HashInput;
			blockTag?: never;
			blockNumber?: never;
	  }
	| {
			blockNumber: bigint;
			blockTag?: never;
			blockHash?: never;
	  };

/**
 * Arguments for getBlockTransactionCount.
 */
export type GetBlockTransactionCountArgs =
	| {
			blockTag?: BlockTag;
			blockHash?: never;
	  }
	| {
			blockHash: HashInput;
			blockTag?: never;
	  };

/**
 * Arguments for waitForTransactionReceipt.
 */
export type WaitForTransactionReceiptArgs = {
	readonly hash: HashInput;
	readonly confirmations?: number;
	readonly timeout?: number;
	readonly pollingInterval?: number;
};

/**
 * Filter parameters for eth_getLogs.
 */
export type LogFilter =
	| {
			blockHash: HashInput;
			fromBlock?: never;
			toBlock?: never;
			address?: AddressInput | AddressInput[];
			topics?: (HashInput | HashInput[] | null)[];
	  }
	| {
			blockHash?: never;
			fromBlock?: BlockTag;
			toBlock?: BlockTag;
			address?: AddressInput | AddressInput[];
			topics?: (HashInput | HashInput[] | null)[];
	  };

/**
 * Filter parameters for eth_newFilter.
 */
export type EventFilter = {
	readonly address?: AddressInput | AddressInput[];
	readonly topics?: (HashInput | HashInput[] | null)[];
	readonly fromBlock?: BlockTag;
	readonly toBlock?: BlockTag;
};

/**
 * Withdrawal object (EIP-4895).
 */
export interface WithdrawalType {
	index: string;
	validatorIndex: string;
	address: string;
	amount: string;
}

/**
 * Ethereum block as returned by JSON-RPC.
 */
export interface BlockType {
	number: string | null;
	hash: string | null;
	parentHash: string;
	nonce: string;
	sha3Uncles: string;
	logsBloom: string;
	transactionsRoot: string;
	stateRoot: string;
	receiptsRoot: string;
	miner: string;
	difficulty: string;
	totalDifficulty: string;
	extraData: string;
	size: string;
	gasLimit: string;
	gasUsed: string;
	timestamp: string;
	transactions: string[] | TransactionType[];
	uncles: string[];
	baseFeePerGas?: string;
	withdrawals?: WithdrawalType[];
	withdrawalsRoot?: string;
	blobGasUsed?: string;
	excessBlobGas?: string;
	parentBeaconBlockRoot?: string;
}

/**
 * Ethereum transaction as returned by JSON-RPC.
 */
export interface TransactionType {
	hash: string;
	nonce: string;
	blockHash: string | null;
	blockNumber: string | null;
	transactionIndex: string | null;
	from: string;
	to: string | null;
	value: string;
	gas: string;
	gasPrice?: string;
	maxFeePerGas?: string;
	maxPriorityFeePerGas?: string;
	input: string;
	v?: string;
	r?: string;
	s?: string;
	type?: string;
	accessList?: Array<{ address: string; storageKeys: string[] }>;
	chainId?: string;
	maxFeePerBlobGas?: string;
	blobVersionedHashes?: string[];
	yParity?: string;
}

/**
 * Transaction receipt as returned by JSON-RPC.
 */
export interface ReceiptType {
	transactionHash: string;
	transactionIndex: string;
	blockHash: string;
	blockNumber: string;
	from: string;
	to: string | null;
	cumulativeGasUsed: string;
	gasUsed: string;
	effectiveGasPrice?: string;
	contractAddress: string | null;
	logs: LogType[];
	logsBloom: string;
	type?: string;
	status: string;
}

/**
 * Event log as returned by JSON-RPC.
 */
export interface LogType {
	address: string;
	topics: string[];
	data: string;
	blockNumber: string;
	transactionHash: string;
	transactionIndex: string;
	blockHash: string;
	logIndex: string;
	removed: boolean;
}

/**
 * Result type for eth_getFilterChanges.
 */
export type FilterChanges = LogType[] | `0x${string}`[];

/**
 * Access list result from eth_createAccessList.
 */
export interface AccessListType {
	accessList: Array<{ address: string; storageKeys: string[] }>;
	gasUsed: string;
}

/**
 * Fee history result from eth_feeHistory.
 */
export interface FeeHistoryType {
	oldestBlock: string;
	baseFeePerGas: string[];
	gasUsedRatio: number[];
	reward?: string[][];
}

/**
 * Syncing status result from eth_syncing.
 */
export type SyncingStatus =
	| false
	| {
			startingBlock: string;
			currentBlock: string;
			highestBlock: string;
	  };

/**
 * Storage proof for a single slot.
 */
export interface StorageProofType {
	key: string;
	value: string;
	proof: string[];
}

/**
 * Account proof result from eth_getProof.
 */
export interface ProofType {
	address: string;
	accountProof: string[];
	balance: string;
	codeHash: string;
	nonce: string;
	storageHash: string;
	storageProof: StorageProofType[];
}

/**
 * Uncle block type (partial block without transactions).
 */
export interface UncleBlockType {
	number: string | null;
	hash: string | null;
	parentHash: string;
	nonce: string;
	sha3Uncles: string;
	logsBloom: string;
	transactionsRoot: string;
	stateRoot: string;
	receiptsRoot: string;
	miner: string;
	difficulty: string;
	totalDifficulty: string;
	extraData: string;
	size: string;
	gasLimit: string;
	gasUsed: string;
	timestamp: string;
	uncles: string[];
}

/**
 * Arguments for getUncle.
 */
export type GetUncleArgs =
	| {
			blockTag?: BlockTag;
			blockHash?: never;
	  }
	| {
			blockHash: HashInput;
			blockTag?: never;
	  };

/**
 * Arguments for getUncleCount.
 */
export type GetUncleCountArgs =
	| {
			blockTag?: BlockTag;
			blockHash?: never;
	  }
	| {
			blockHash: HashInput;
			blockTag?: never;
	  };
