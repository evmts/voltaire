/**
 * TransactionStream Type Definitions
 *
 * Types for streaming transactions over JSON-RPC with lifecycle tracking.
 *
 * @module transaction/TransactionStreamType
 */

import type { AddressType } from "../primitives/Address/AddressType.js";
import type { BlockHashType } from "../primitives/BlockHash/BlockHashType.js";
import type { ReceiptType } from "../primitives/Receipt/ReceiptType.js";
import type { TransactionHashType } from "../primitives/TransactionHash/TransactionHashType.js";
import type { TypedProvider } from "../provider/TypedProvider.js";

// ============================================================================
// Transaction State Types
// ============================================================================

/**
 * Transaction lifecycle state
 *
 * - 'pending': Transaction in mempool, not yet mined
 * - 'confirmed': Transaction included in a block
 * - 'dropped': Transaction removed from mempool (replaced or expired)
 * - 'replaced': Transaction replaced by another with same nonce
 */
export type TransactionState = "pending" | "confirmed" | "dropped" | "replaced";

/**
 * Pending transaction data
 */
export interface PendingTransaction {
	/** Transaction hash */
	readonly hash: TransactionHashType;
	/** Sender address */
	readonly from: AddressType;
	/** Recipient address (null for contract creation) */
	readonly to: AddressType | null;
	/** Value in wei */
	readonly value: bigint;
	/** Gas limit */
	readonly gas: bigint;
	/** Gas price (legacy) or max fee per gas (EIP-1559) */
	readonly gasPrice: bigint;
	/** Max priority fee per gas (EIP-1559) */
	readonly maxPriorityFeePerGas?: bigint;
	/** Max fee per gas (EIP-1559) */
	readonly maxFeePerGas?: bigint;
	/** Transaction nonce */
	readonly nonce: bigint;
	/** Input data */
	readonly input: Uint8Array;
	/** Transaction type */
	readonly type: "legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702";
}

/**
 * Confirmed transaction with receipt
 */
export interface ConfirmedTransaction extends PendingTransaction {
	/** Block hash */
	readonly blockHash: BlockHashType;
	/** Block number */
	readonly blockNumber: bigint;
	/** Transaction index in block */
	readonly transactionIndex: number;
	/** Transaction receipt */
	readonly receipt: ReceiptType;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Transaction filter options
 */
export interface TransactionFilter {
	/** Filter by sender address */
	from?: AddressType | `0x${string}`;
	/** Filter by recipient address */
	to?: AddressType | `0x${string}`;
	/** Filter by method selector (first 4 bytes of input) */
	methodId?: Uint8Array | `0x${string}`;
	/** Minimum value in wei */
	minValue?: bigint;
	/** Maximum value in wei */
	maxValue?: bigint;
}

// ============================================================================
// Options Types
// ============================================================================

/**
 * Retry configuration for RPC calls
 */
export interface RetryOptions {
	/** Maximum retry attempts. Default: 3 */
	maxRetries?: number;
	/** Initial delay between retries in ms. Default: 1000 */
	initialDelay?: number;
	/** Maximum delay between retries in ms. Default: 30000 */
	maxDelay?: number;
}

/**
 * Options for watching pending transactions
 */
export interface WatchPendingOptions {
	/** Transaction filter */
	filter?: TransactionFilter;
	/** Polling interval in ms. Default: 1000 */
	pollingInterval?: number;
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
	/** Retry configuration */
	retry?: RetryOptions;
}

/**
 * Options for watching confirmed transactions
 */
export interface WatchConfirmedOptions extends WatchPendingOptions {
	/** Start block for watching. Default: current block */
	fromBlock?: bigint;
	/** Number of confirmations required. Default: 1 */
	confirmations?: number;
}

/**
 * Options for tracking a specific transaction
 */
export interface TrackOptions {
	/** Polling interval in ms. Default: 1000 */
	pollingInterval?: number;
	/** Timeout in ms. Default: 300000 (5 minutes) */
	timeout?: number;
	/** Number of confirmations required. Default: 1 */
	confirmations?: number;
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Metadata for transaction events
 */
export interface TransactionStreamMetadata {
	/** Current chain head block number */
	chainHead: bigint;
	/** Timestamp of event */
	timestamp: number;
}

/**
 * Pending transaction event
 */
export interface PendingTransactionEvent {
	readonly type: "pending";
	/** Pending transaction */
	readonly transaction: PendingTransaction;
	/** Stream metadata */
	readonly metadata: TransactionStreamMetadata;
}

/**
 * Confirmed transaction event
 */
export interface ConfirmedTransactionEvent {
	readonly type: "confirmed";
	/** Confirmed transaction with receipt */
	readonly transaction: ConfirmedTransaction;
	/** Stream metadata */
	readonly metadata: TransactionStreamMetadata;
}

/**
 * Dropped transaction event
 */
export interface DroppedTransactionEvent {
	readonly type: "dropped";
	/** Transaction hash that was dropped */
	readonly hash: TransactionHashType;
	/** Reason for dropping */
	readonly reason: "replaced" | "timeout" | "underpriced" | "unknown";
	/** Replacement transaction hash (if replaced) */
	readonly replacedBy?: TransactionHashType;
	/** Stream metadata */
	readonly metadata: TransactionStreamMetadata;
}

/**
 * Transaction stream event - discriminated union
 */
export type TransactionStreamEvent =
	| PendingTransactionEvent
	| ConfirmedTransactionEvent
	| DroppedTransactionEvent;

// ============================================================================
// TransactionStream Types
// ============================================================================

/**
 * TransactionStream instance
 */
export interface TransactionStream {
	/**
	 * Watch for pending transactions in the mempool
	 *
	 * @param options - Watch options including filter
	 * @yields PendingTransactionEvent for each new pending transaction
	 *
	 * @example
	 * ```typescript
	 * for await (const event of stream.watchPending({
	 *   filter: { to: usdcAddress }
	 * })) {
	 *   console.log(`Pending: ${event.transaction.hash}`);
	 * }
	 * ```
	 */
	watchPending(
		options?: WatchPendingOptions,
	): AsyncGenerator<PendingTransactionEvent>;

	/**
	 * Watch for confirmed transactions
	 *
	 * @param options - Watch options including filter and confirmations
	 * @yields ConfirmedTransactionEvent for each confirmed transaction
	 *
	 * @example
	 * ```typescript
	 * for await (const event of stream.watchConfirmed({
	 *   filter: { from: myAddress },
	 *   confirmations: 3
	 * })) {
	 *   console.log(`Confirmed: ${event.transaction.hash}`);
	 * }
	 * ```
	 */
	watchConfirmed(
		options?: WatchConfirmedOptions,
	): AsyncGenerator<ConfirmedTransactionEvent>;

	/**
	 * Track a specific transaction through its lifecycle
	 *
	 * @param txHash - Transaction hash to track
	 * @param options - Tracking options
	 * @yields TransactionStreamEvent for state changes
	 *
	 * @example
	 * ```typescript
	 * for await (const event of stream.track(txHash)) {
	 *   if (event.type === 'confirmed') {
	 *     console.log(`Confirmed in block ${event.transaction.blockNumber}`);
	 *     break;
	 *   } else if (event.type === 'dropped') {
	 *     console.log(`Dropped: ${event.reason}`);
	 *     break;
	 *   }
	 * }
	 * ```
	 */
	track(
		txHash: TransactionHashType | `0x${string}`,
		options?: TrackOptions,
	): AsyncGenerator<TransactionStreamEvent>;
}

// ============================================================================
// Constructor Types
// ============================================================================

/**
 * Options for creating a TransactionStream
 */
export interface TransactionStreamConstructorOptions {
	/** EIP-1193 provider */
	provider: TypedProvider;
}

/**
 * TransactionStream factory function type
 */
export type TransactionStreamFactory = (
	options: TransactionStreamConstructorOptions,
) => TransactionStream;
