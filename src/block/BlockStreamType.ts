/**
 * BlockStream Type Definitions
 *
 * Types for streaming blocks over JSON-RPC with reorg support.
 *
 * @module block/BlockStreamType
 */

import type { BlockType } from "../primitives/Block/BlockType.js";
import type { BlockHashType } from "../primitives/BlockHash/BlockHashType.js";
import type { ReceiptType } from "../primitives/Receipt/ReceiptType.js";
import type { TypedProvider } from "../provider/TypedProvider.js";

// ============================================================================
// Block Include Types
// ============================================================================

/**
 * Block content level to include in stream
 *
 * - 'header': Block header only (minimal data)
 * - 'transactions': Header + full transaction objects
 * - 'receipts': Header + transactions + transaction receipts
 */
export type BlockInclude = "header" | "transactions" | "receipts";

/**
 * Light block - minimal block info for reorg tracking
 *
 * Contains only the fields needed to track chain state and detect reorgs.
 */
export interface LightBlock {
	/** Block number */
	readonly number: bigint;
	/** Block hash */
	readonly hash: BlockHashType;
	/** Parent block hash */
	readonly parentHash: BlockHashType;
	/** Block timestamp (unix seconds) */
	readonly timestamp: bigint;
}

/**
 * Block with optional transactions based on include level
 */
export type StreamBlock<TInclude extends BlockInclude> =
	TInclude extends "receipts"
		? BlockType & { readonly receipts: readonly ReceiptType[] }
		: TInclude extends "transactions"
			? BlockType
			: Omit<BlockType, "body"> & {
					readonly body: Omit<BlockType["body"], "transactions"> & {
						readonly transactions: readonly `0x${string}`[];
					};
				};

// ============================================================================
// Options Types
// ============================================================================

/**
 * Retry configuration for RPC calls
 */
export interface RetryOptions {
	/** Maximum number of retry attempts. Default: 3 */
	maxRetries?: number;
	/** Initial delay between retries in ms. Default: 1000 */
	initialDelay?: number;
	/** Maximum delay between retries in ms. Default: 30000 */
	maxDelay?: number;
}

/**
 * Base options for BlockStream operations
 */
export interface BlockStreamOptions<TInclude extends BlockInclude = "header"> {
	/** Content level to include. Default: 'header' */
	include?: TInclude;
	/** Initial chunk size in blocks. Default: 100 */
	chunkSize?: number;
	/** Minimum chunk size after reduction. Default: 10 */
	minChunkSize?: number;
	/** Polling interval for watch mode in ms. Default: 1000 */
	pollingInterval?: number;
	/** Maximum queued blocks to fetch when catching up. Default: 50 */
	maxQueuedBlocks?: number;
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
	/** Retry configuration */
	retry?: RetryOptions;
}

/**
 * Options for backfill operation
 */
export interface BackfillOptions<TInclude extends BlockInclude = "header">
	extends BlockStreamOptions<TInclude> {
	/** Start block (inclusive, required) */
	fromBlock: bigint;
	/** End block (inclusive, required) */
	toBlock: bigint;
}

/**
 * Options for watch operation
 */
export interface WatchOptions<TInclude extends BlockInclude = "header">
	extends BlockStreamOptions<TInclude> {
	/** Start watching from this block. Default: current block */
	fromBlock?: bigint;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Metadata included with each block event
 */
export interface BlockStreamMetadata {
	/** Current chain head block number */
	chainHead: bigint;
}

/**
 * Blocks event - new canonical blocks
 */
export interface BlocksEvent<TInclude extends BlockInclude> {
	readonly type: "blocks";
	/** Blocks in ascending order by number */
	readonly blocks: readonly StreamBlock<TInclude>[];
	/** Stream metadata */
	readonly metadata: BlockStreamMetadata;
}

/**
 * Reorg event - chain reorganization detected
 *
 * Contains both removed blocks (old chain) and added blocks (new chain).
 * Consumer should:
 * 1. Undo state for removed blocks (newest to oldest)
 * 2. Apply state for added blocks (oldest to newest)
 */
export interface ReorgEvent<TInclude extends BlockInclude> {
	readonly type: "reorg";
	/** Blocks removed from canonical chain (newest first) */
	readonly removed: readonly LightBlock[];
	/** Blocks added to canonical chain (oldest first) */
	readonly added: readonly StreamBlock<TInclude>[];
	/** Common ancestor block (last block before divergence) */
	readonly commonAncestor: LightBlock;
	/** Stream metadata */
	readonly metadata: BlockStreamMetadata;
}

/**
 * BlockStream event - discriminated union of all event types
 */
export type BlockStreamEvent<TInclude extends BlockInclude> =
	| BlocksEvent<TInclude>
	| ReorgEvent<TInclude>;

// ============================================================================
// BlockStream Types
// ============================================================================

/**
 * BlockStream instance - provides backfill and watch methods
 */
export interface BlockStream {
	/**
	 * Backfill historical blocks within a range
	 *
	 * Fetches blocks in chunks with dynamic sizing to handle RPC limits.
	 * No reorg tracking for backfill (historical blocks are final).
	 *
	 * @param options - Backfill options including fromBlock and toBlock
	 * @yields BlocksEvent with blocks and metadata
	 *
	 * @example
	 * ```typescript
	 * for await (const { blocks } of stream.backfill({
	 *   fromBlock: 18000000n,
	 *   toBlock: 19000000n,
	 *   include: 'transactions'
	 * })) {
	 *   for (const block of blocks) {
	 *     console.log(`Block ${block.header.number}`);
	 *   }
	 * }
	 * ```
	 */
	backfill<TInclude extends BlockInclude = "header">(
		options: BackfillOptions<TInclude>,
	): AsyncGenerator<BlocksEvent<TInclude>>;

	/**
	 * Watch for new blocks with reorg detection
	 *
	 * Continuously polls for new blocks, tracking chain state to detect
	 * and report reorganizations. Use AbortSignal to stop watching.
	 *
	 * @param options - Watch options including optional fromBlock
	 * @yields BlockStreamEvent (blocks or reorg)
	 *
	 * @example
	 * ```typescript
	 * const controller = new AbortController();
	 * for await (const event of stream.watch({
	 *   signal: controller.signal,
	 *   include: 'receipts'
	 * })) {
	 *   if (event.type === 'reorg') {
	 *     for (const block of event.removed) {
	 *       rollback(block.hash);
	 *     }
	 *   } else {
	 *     for (const block of event.blocks) {
	 *       process(block);
	 *     }
	 *   }
	 * }
	 * ```
	 */
	watch<TInclude extends BlockInclude = "header">(
		options?: WatchOptions<TInclude>,
	): AsyncGenerator<BlockStreamEvent<TInclude>>;
}

// ============================================================================
// Constructor Types
// ============================================================================

/**
 * Options for creating a BlockStream
 */
export interface BlockStreamConstructorOptions {
	/** EIP-1193 provider */
	provider: TypedProvider;
}

/**
 * BlockStream factory function type
 */
export type BlockStreamFactory = (
	options: BlockStreamConstructorOptions,
) => BlockStream;
