/**
 * BlockStream Factory
 *
 * Creates BlockStream instances for streaming blocks over JSON-RPC with
 * reorg detection and handling.
 *
 * @module block/BlockStream
 */

import * as Hex from "../primitives/Hex/index.js";
import {
	BlockRangeTooLargeError,
	BlockStreamAbortedError,
	UnrecoverableReorgError,
} from "../stream/errors.js";

/**
 * @typedef {import('./BlockStreamType.js').BlockStreamConstructorOptions} BlockStreamConstructorOptions
 * @typedef {import('./BlockStreamType.js').BlockStream} BlockStreamInstance
 * @typedef {import('./BlockStreamType.js').LightBlock} LightBlock
 * @typedef {import('./BlockStreamType.js').BlockInclude} BlockInclude
 */

/**
 * Default options
 */
const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_MIN_CHUNK_SIZE = 10;
const DEFAULT_POLLING_INTERVAL = 1000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;
const DEFAULT_MAX_QUEUED_BLOCKS = 50;
const SUCCESS_STREAK_THRESHOLD = 5;
const CHUNK_INCREASE_FACTOR = 1.25;
const CHUNK_DECREASE_FACTOR = 0.5;

/**
 * Check if error indicates block range is too large
 * @param {unknown} error
 * @returns {boolean}
 */
function isBlockRangeTooLargeError(error) {
	if (!error || typeof error !== "object") return false;
	const msg =
		"message" in error && typeof error.message === "string"
			? error.message.toLowerCase()
			: "";
	const code = "code" in error ? error.code : undefined;
	return (
		msg.includes("block range") ||
		msg.includes("too large") ||
		msg.includes("limit exceeded") ||
		msg.includes("query returned more than") ||
		code === -32005
	);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a simple mutex lock
 * @returns {{ lock: () => Promise<void>, unlock: () => void }}
 */
function createLock() {
	let locked = false;
	/** @type {Array<() => void>} */
	const waiting = [];

	return {
		lock: () => {
			return new Promise((resolve) => {
				if (!locked) {
					locked = true;
					resolve();
				} else {
					waiting.push(resolve);
				}
			});
		},
		unlock: () => {
			const next = waiting.shift();
			if (next) {
				next();
			} else {
				locked = false;
			}
		},
	};
}

/**
 * Extract light block info from full block
 * @param {*} block
 * @returns {LightBlock}
 */
function toLightBlock(block) {
	return {
		number:
			typeof block.header?.number === "bigint"
				? block.header.number
				: BigInt(block.header?.number ?? block.number),
		hash: block.hash,
		parentHash: block.header?.parentHash ?? block.parentHash,
		timestamp:
			typeof block.header?.timestamp === "bigint"
				? block.header.timestamp
				: BigInt(block.header?.timestamp ?? block.timestamp),
	};
}

/**
 * Create a BlockStream for streaming blocks with reorg support.
 *
 * BlockStream provides robust block streaming with:
 * - **Dynamic chunking**: Automatically adjusts chunk size based on RPC limits
 * - **Reorg detection**: Tracks parent hash chain to detect reorganizations
 * - **Retry logic**: Exponential backoff for transient errors
 * - **AbortSignal**: Clean cancellation support
 *
 * @param {BlockStreamConstructorOptions} options
 * @returns {BlockStreamInstance}
 *
 * @example
 * ```typescript
 * import { BlockStream } from '@voltaire/block';
 *
 * const stream = BlockStream({ provider });
 *
 * // Backfill historical blocks
 * for await (const { blocks } of stream.backfill({
 *   fromBlock: 18000000n,
 *   toBlock: 19000000n,
 *   include: 'transactions'
 * })) {
 *   for (const block of blocks) {
 *     console.log(`Block ${block.header.number}`);
 *   }
 * }
 *
 * // Watch for new blocks with reorg handling
 * const controller = new AbortController();
 * for await (const event of stream.watch({ signal: controller.signal })) {
 *   if (event.type === 'reorg') {
 *     console.log('Reorg detected:', event.removed.length, 'blocks removed');
 *   } else {
 *     for (const block of event.blocks) {
 *       console.log('New block:', block.header.number);
 *     }
 *   }
 * }
 * ```
 */
export function BlockStream(options) {
	const { provider } = options;

	// Track whether eth_getBlockReceipts is supported
	let isBlockReceiptsSupported = true;

	/**
	 * Fetch a block by number with optional transactions
	 * @param {bigint} blockNumber
	 * @param {BlockInclude} include
	 * @param {import('./BlockStreamType.js').RetryOptions} [retryOptions]
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<any>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
	async function fetchBlock(blockNumber, include, retryOptions, signal) {
		const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
		const initialDelay = retryOptions?.initialDelay ?? DEFAULT_INITIAL_DELAY;
		const maxDelay = retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY;

		const includeTransactions = include !== "header";
		let attempt = 0;
		let delay = initialDelay;

		while (true) {
			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}

			try {
				/** @type {Record<string, unknown> | null} */
				const block = await /** @type {any} */ (provider).request({
					method: "eth_getBlockByNumber",
					params: [`0x${blockNumber.toString(16)}`, includeTransactions],
				});

				if (!block) {
					throw new Error(`Block ${blockNumber} not found`);
				}

				// Fetch receipts if needed
				if (include === "receipts") {
					const receipts = await fetchBlockReceipts(
						block,
						retryOptions,
						signal,
					);
					return { ...block, receipts };
				}

				return block;
			} catch (error) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}

				attempt++;
				if (attempt >= maxRetries) {
					throw error;
				}

				await sleep(delay);
				delay = Math.min(delay * 2, maxDelay);
			}
		}
	}

	/**
	 * Fetch a block by hash
	 * @param {string} blockHash
	 * @param {BlockInclude} include
	 * @param {import('./BlockStreamType.js').RetryOptions} [retryOptions]
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<any>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
	async function fetchBlockByHash(blockHash, include, retryOptions, signal) {
		const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
		const initialDelay = retryOptions?.initialDelay ?? DEFAULT_INITIAL_DELAY;
		const maxDelay = retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY;

		const includeTransactions = include !== "header";
		let attempt = 0;
		let delay = initialDelay;

		while (true) {
			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}

			try {
				/** @type {Record<string, unknown> | null} */
				const block = await /** @type {any} */ (provider).request({
					method: "eth_getBlockByHash",
					params: [blockHash, includeTransactions],
				});

				if (!block) {
					throw new Error(`Block ${blockHash} not found`);
				}

				// Fetch receipts if needed
				if (include === "receipts") {
					const receipts = await fetchBlockReceipts(
						block,
						retryOptions,
						signal,
					);
					return { ...block, receipts };
				}

				return block;
			} catch (error) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}

				attempt++;
				if (attempt >= maxRetries) {
					throw error;
				}

				await sleep(delay);
				delay = Math.min(delay * 2, maxDelay);
			}
		}
	}

	/**
	 * Fetch receipts for a block with fallback to individual receipt fetching
	 * @param {*} block
	 * @param {import('./BlockStreamType.js').RetryOptions} [retryOptions]
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<any[]>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
	async function fetchBlockReceipts(block, retryOptions, signal) {
		const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
		const initialDelay = retryOptions?.initialDelay ?? DEFAULT_INITIAL_DELAY;
		const maxDelay = retryOptions?.maxDelay ?? DEFAULT_MAX_DELAY;

		// Try eth_getBlockReceipts first if supported
		if (isBlockReceiptsSupported) {
			let attempt = 0;
			let delay = initialDelay;

			while (attempt < maxRetries) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}

				try {
					const receipts = await /** @type {any} */ (provider).request({
						method: "eth_getBlockReceipts",
						params: [block.hash],
					});
					return receipts ?? [];
				} catch (error) {
					if (signal?.aborted) {
						throw new BlockStreamAbortedError();
					}

					// Check if method is not supported
					const errorMsg =
						error instanceof Error ? error.message.toLowerCase() : "";
					if (
						errorMsg.includes("method not found") ||
						errorMsg.includes("not supported") ||
						errorMsg.includes("unknown method")
					) {
						isBlockReceiptsSupported = false;
						break;
					}

					attempt++;
					if (attempt >= maxRetries) {
						throw error;
					}

					await sleep(delay);
					delay = Math.min(delay * 2, maxDelay);
				}
			}
		}

		// Fallback: fetch individual receipts
		const transactions = block.body?.transactions ?? block.transactions ?? [];
		/** @type {Promise<any>[]} */
		const receipts = await Promise.all(
			// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: retry logic
			transactions.map(async (/** @type {any} */ tx) => {
				const txHash = typeof tx === "string" ? tx : tx.hash;
				let attempt = 0;
				let delay = initialDelay;

				while (true) {
					if (signal?.aborted) {
						throw new BlockStreamAbortedError();
					}

					try {
						const receipt = await /** @type {any} */ (provider).request({
							method: "eth_getTransactionReceipt",
							params: [txHash],
						});
						return receipt;
					} catch (error) {
						if (signal?.aborted) {
							throw new BlockStreamAbortedError();
						}

						attempt++;
						if (attempt >= maxRetries) {
							throw error;
						}

						await sleep(delay);
						delay = Math.min(delay * 2, maxDelay);
					}
				}
			}),
		);

		return receipts.filter(Boolean);
	}

	/**
	 * Fetch multiple blocks in a range
	 * @param {bigint} fromBlock
	 * @param {bigint} toBlock
	 * @param {BlockInclude} include
	 * @param {import('./BlockStreamType.js').RetryOptions} [retryOptions]
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<any[]>}
	 */
	async function fetchBlocksInRange(
		fromBlock,
		toBlock,
		include,
		retryOptions,
		signal,
	) {
		const blocks = [];
		for (let i = fromBlock; i <= toBlock; i++) {
			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}
			const block = await fetchBlock(i, include, retryOptions, signal);
			blocks.push(block);
		}
		return blocks;
	}

	/**
	 * Get current block number
	 * @param {AbortSignal} [signal]
	 * @returns {Promise<bigint>}
	 */
	async function getCurrentBlockNumber(signal) {
		if (signal?.aborted) {
			throw new BlockStreamAbortedError();
		}
		const result = await /** @type {any} */ (provider).request({
			method: "eth_blockNumber",
			params: [],
		});
		return BigInt(result);
	}

	/**
	 * Backfill historical blocks within a range.
	 *
	 * Uses dynamic chunking to handle large ranges efficiently.
	 * No reorg tracking needed for historical blocks.
	 *
	 * @template {BlockInclude} TInclude
	 * @param {import('./BlockStreamType.js').BackfillOptions<TInclude>} backfillOptions
	 * @returns {AsyncGenerator<import('./BlockStreamType.js').BlocksEvent<TInclude>>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
	async function* backfill(backfillOptions) {
		const { fromBlock, toBlock, signal, retry } = backfillOptions;
		const include = backfillOptions.include ?? "header";
		let chunkSize = backfillOptions.chunkSize ?? DEFAULT_CHUNK_SIZE;
		const minChunkSize = backfillOptions.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE;
		const maxChunkSize = chunkSize * 2;

		let successStreak = 0;
		let currentFrom = fromBlock;

		// Get current chain head for metadata
		const chainHead = await getCurrentBlockNumber(signal);

		while (currentFrom <= toBlock) {
			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}

			const currentTo =
				currentFrom + BigInt(chunkSize) - 1n > toBlock
					? toBlock
					: currentFrom + BigInt(chunkSize) - 1n;

			try {
				const blocks = await fetchBlocksInRange(
					currentFrom,
					currentTo,
					include,
					retry,
					signal,
				);

				// Success - maybe increase chunk size
				successStreak++;
				if (successStreak >= SUCCESS_STREAK_THRESHOLD) {
					chunkSize = Math.min(
						Math.floor(chunkSize * CHUNK_INCREASE_FACTOR),
						maxChunkSize,
					);
					successStreak = 0;
				}

				yield/** @type {import('./BlockStreamType.js').BlocksEvent<TInclude>} */ ({
					type: "blocks",
					blocks,
					metadata: { chainHead },
				});

				currentFrom = currentTo + 1n;
			} catch (error) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}

				if (isBlockRangeTooLargeError(error)) {
					// Reduce chunk size and retry
					chunkSize = Math.max(
						Math.floor(chunkSize * CHUNK_DECREASE_FACTOR),
						minChunkSize,
					);
					successStreak = 0;
					continue;
				}

				throw error;
			}
		}
	}

	/**
	 * Watch for new blocks with reorg detection.
	 *
	 * Continuously polls for new blocks, tracking chain state to detect
	 * and report reorganizations.
	 *
	 * @template {BlockInclude} TInclude
	 * @param {import('./BlockStreamType.js').WatchOptions<TInclude>} [watchOptions]
	 * @returns {AsyncGenerator<import('./BlockStreamType.js').BlockStreamEvent<TInclude>>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
	async function* watch(watchOptions) {
		const signal = watchOptions?.signal;
		const pollingInterval =
			watchOptions?.pollingInterval ?? DEFAULT_POLLING_INTERVAL;
		const maxQueuedBlocks =
			watchOptions?.maxQueuedBlocks ?? DEFAULT_MAX_QUEUED_BLOCKS;
		const retry = watchOptions?.retry;
		const include = watchOptions?.include ?? "header";

		if (signal?.aborted) {
			throw new BlockStreamAbortedError();
		}

		// State for reorg detection
		/** @type {LightBlock[]} */
		let unfinalizedBlocks = [];
		const reconcileLock = createLock();

		// Initialize starting block
		let startBlock = watchOptions?.fromBlock;
		if (startBlock === undefined) {
			startBlock = await getCurrentBlockNumber(signal);
		}

		// Fetch initial block to start tracking
		const initialBlock = await fetchBlock(startBlock, include, retry, signal);
		unfinalizedBlocks.push(toLightBlock(initialBlock));

		yield/** @type {import('./BlockStreamType.js').BlocksEvent<TInclude>} */ ({
			type: "blocks",
			blocks: [initialBlock],
			metadata: { chainHead: startBlock },
		});

		/**
		 * Get the latest tracked block
		 * @returns {LightBlock}
		 */
		function getLatestBlock() {
			const block = unfinalizedBlocks[unfinalizedBlocks.length - 1];
			if (!block) {
				throw new Error("No blocks tracked");
			}
			return block;
		}

		/**
		 * Walk back to find common ancestor
		 * @param {*} newBlock - Block that doesn't connect to our chain
		 * @returns {Promise<{ commonAncestor: LightBlock, removed: LightBlock[], newChainBlocks: any[] }>}
		 */
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reorg detection logic
		async function findCommonAncestor(newBlock) {
			/** @type {LightBlock[]} */
			const removed = [];
			/** @type {any[]} */
			const newChainBlocks = [newBlock];

			// Walk back on new chain until we find a common block
			let currentNewBlock = newBlock;

			while (true) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}

				// Find matching block in our tracked history by hash
				const matchIdx = unfinalizedBlocks.findIndex(
					(b) =>
						Hex.fromBytes(b.hash) ===
						Hex.fromBytes(
							currentNewBlock.header?.parentHash ?? currentNewBlock.parentHash,
						),
				);

				if (matchIdx !== -1) {
					// Found common ancestor
					const commonAncestor = /** @type {LightBlock} */ (
						unfinalizedBlocks[matchIdx]
					);
					// Mark all blocks after common ancestor as removed
					removed.push(...unfinalizedBlocks.slice(matchIdx + 1).reverse());
					// Trim our chain to common ancestor
					unfinalizedBlocks = unfinalizedBlocks.slice(0, matchIdx + 1);
					return {
						commonAncestor,
						removed,
						newChainBlocks: newChainBlocks.reverse(),
					};
				}

				// Check if we've exhausted our tracked history
				if (unfinalizedBlocks.length === 0) {
					throw new UnrecoverableReorgError(
						BigInt(newChainBlocks.length),
						BigInt(removed.length + unfinalizedBlocks.length),
					);
				}

				// Need to go further back - fetch parent of current new block
				const parentHash =
					currentNewBlock.header?.parentHash ?? currentNewBlock.parentHash;
				const parentHashHex =
					typeof parentHash === "string"
						? parentHash
						: Hex.fromBytes(parentHash);

				// Remove oldest tracked block and add to removed
				if (removed.length === 0) {
					// First iteration - remove blocks from tip
					removed.push(...unfinalizedBlocks.reverse());
					unfinalizedBlocks = [];
				}

				// Fetch parent block on new chain
				currentNewBlock = await fetchBlockByHash(
					parentHashHex,
					include,
					retry,
					signal,
				);
				newChainBlocks.push(currentNewBlock);

				// Safety check - don't go too far back
				if (newChainBlocks.length > maxQueuedBlocks) {
					throw new UnrecoverableReorgError(
						BigInt(newChainBlocks.length),
						BigInt(maxQueuedBlocks),
					);
				}
			}
		}

		/**
		 * Reconcile a new block into our chain
		 * @param {*} block
		 * @returns {AsyncGenerator<import('./BlockStreamType.js').BlockStreamEvent<TInclude>>}
		 */
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reorg reconciliation logic
		async function* reconcileBlock(block) {
			const latestBlock = getLatestBlock();
			const blockNumber =
				typeof block.header?.number === "bigint"
					? block.header.number
					: BigInt(block.header?.number ?? block.number);
			const blockHash = block.hash;
			const blockParentHash = block.header?.parentHash ?? block.parentHash;

			// Case 1: Duplicate block (same hash as latest)
			if (Hex.fromBytes(latestBlock.hash) === Hex.fromBytes(blockHash)) {
				return;
			}

			// Case 2: Block number regression - reorg detected
			if (blockNumber <= latestBlock.number) {
				const { commonAncestor, removed, newChainBlocks } =
					await findCommonAncestor(block);

				// Add new chain blocks to our tracking
				for (const b of newChainBlocks) {
					unfinalizedBlocks.push(toLightBlock(b));
				}

				const chainHead = await getCurrentBlockNumber(signal);

				yield/** @type {import('./BlockStreamType.js').ReorgEvent<TInclude>} */ ({
					type: "reorg",
					removed,
					added: newChainBlocks,
					commonAncestor,
					metadata: { chainHead },
				});
				return;
			}

			// Case 3: Missing blocks - need to fill gap
			if (blockNumber > latestBlock.number + 1n) {
				const missingBlocks = await fetchBlocksInRange(
					latestBlock.number + 1n,
					blockNumber - 1n,
					include,
					retry,
					signal,
				);

				// Reconcile each missing block
				for (const missingBlock of missingBlocks) {
					yield* reconcileBlock(missingBlock);
				}

				// Now reconcile the original block
				yield* reconcileBlock(block);
				return;
			}

			// Case 4: Parent hash mismatch - reorg detected
			const parentHashHex =
				typeof blockParentHash === "string"
					? blockParentHash
					: Hex.fromBytes(blockParentHash);
			const latestHashHex = Hex.fromBytes(latestBlock.hash);

			if (parentHashHex !== latestHashHex) {
				const { commonAncestor, removed, newChainBlocks } =
					await findCommonAncestor(block);

				// Add new chain blocks to our tracking
				for (const b of newChainBlocks) {
					unfinalizedBlocks.push(toLightBlock(b));
				}

				const chainHead = await getCurrentBlockNumber(signal);

				yield/** @type {import('./BlockStreamType.js').ReorgEvent<TInclude>} */ ({
					type: "reorg",
					removed,
					added: newChainBlocks,
					commonAncestor,
					metadata: { chainHead },
				});
				return;
			}

			// Case 5: Normal extension - block connects properly
			unfinalizedBlocks.push(toLightBlock(block));

			// Prune old blocks to prevent unbounded memory growth
			// Keep at most maxQueuedBlocks
			if (unfinalizedBlocks.length > maxQueuedBlocks) {
				unfinalizedBlocks = unfinalizedBlocks.slice(-maxQueuedBlocks);
			}

			const chainHead = await getCurrentBlockNumber(signal);

			yield/** @type {import('./BlockStreamType.js').BlocksEvent<TInclude>} */ ({
				type: "blocks",
				blocks: [block],
				metadata: { chainHead },
			});
		}

		// Main watch loop
		while (true) {
			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}

			try {
				const currentBlockNumber = await getCurrentBlockNumber(signal);
				const latestTracked = getLatestBlock();

				if (currentBlockNumber > latestTracked.number) {
					// Fetch the latest block
					const latestBlock = await fetchBlock(
						currentBlockNumber,
						include,
						retry,
						signal,
					);

					// Acquire lock for serial reconciliation
					await reconcileLock.lock();
					try {
						yield* reconcileBlock(latestBlock);
					} finally {
						reconcileLock.unlock();
					}
				}
			} catch (error) {
				if (signal?.aborted) {
					throw new BlockStreamAbortedError();
				}
				// Log error but continue polling
				console.error("BlockStream watch error:", error);
			}

			if (signal?.aborted) {
				throw new BlockStreamAbortedError();
			}

			await sleep(pollingInterval);
		}
	}

	return /** @type {BlockStreamInstance} */ ({
		backfill,
		watch,
	});
}
