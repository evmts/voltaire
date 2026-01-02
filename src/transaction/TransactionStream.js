/**
 * TransactionStream Factory
 *
 * Creates TransactionStream instances for watching transactions.
 *
 * @module transaction/TransactionStream
 */

import { bytesToHex } from "./bytesToHex.js";
import { getTransactionType } from "./getTransactionType.js";
import { hexToBytes } from "./hexToBytes.js";
import { matchesFilter } from "./matchesFilter.js";
import { parsePendingTransaction } from "./parsePendingTransaction.js";
import { sleep } from "./sleep.js";

/**
 * @typedef {import('./TransactionStreamType.js').TransactionStreamConstructorOptions} TransactionStreamConstructorOptions
 * @typedef {import('./TransactionStreamType.js').TransactionStream} TransactionStreamInstance
 * @typedef {import('./TransactionStreamType.js').WatchPendingOptions} WatchPendingOptions
 * @typedef {import('./TransactionStreamType.js').WatchConfirmedOptions} WatchConfirmedOptions
 * @typedef {import('./TransactionStreamType.js').TrackOptions} TrackOptions
 * @typedef {import('./TransactionStreamType.js').PendingTransactionEvent} PendingTransactionEvent
 * @typedef {import('./TransactionStreamType.js').ConfirmedTransactionEvent} ConfirmedTransactionEvent
 * @typedef {import('./TransactionStreamType.js').TransactionStreamEvent} TransactionStreamEvent
 * @typedef {import('./TransactionStreamType.js').PendingTransaction} PendingTransaction
 * @typedef {import('./TransactionStreamType.js').ConfirmedTransaction} ConfirmedTransaction
 * @typedef {import('./TransactionStreamType.js').TransactionFilter} TransactionFilter
 */

const DEFAULT_POLLING_INTERVAL = 1000;
const DEFAULT_TIMEOUT = 300000; // 5 minutes

/**
 * Create a TransactionStream instance
 *
 * @param {TransactionStreamConstructorOptions} options
 * @returns {TransactionStreamInstance}
 *
 * @example
 * ```typescript
 * const stream = TransactionStream({ provider });
 *
 * // Watch pending transactions
 * for await (const event of stream.watchPending({ filter: { to: usdcAddress } })) {
 *   console.log(`Pending: ${event.transaction.hash}`);
 * }
 *
 * // Track specific transaction
 * for await (const event of stream.track(txHash)) {
 *   if (event.type === 'confirmed') {
 *     console.log(`Confirmed!`);
 *     break;
 *   }
 * }
 * ```
 */
export function TransactionStream(options) {
	const { provider } = options;

	/**
	 * Get current block number
	 * @returns {Promise<bigint>}
	 */
	async function getBlockNumber() {
		const result = await provider.request({ method: "eth_blockNumber" });
		return BigInt(/** @type {string} */ (result));
	}

	/**
	 * Get transaction by hash
	 * @param {string} hash
	 * @returns {Promise<any | null>}
	 */
	async function getTransaction(hash) {
		return provider.request(
			/** @type {any} */ ({
				method: "eth_getTransactionByHash",
				params: [hash],
			}),
		);
	}

	/**
	 * Get transaction receipt
	 * @param {string} hash
	 * @returns {Promise<any | null>}
	 */
	async function getReceipt(hash) {
		return provider.request(
			/** @type {any} */ ({
				method: "eth_getTransactionReceipt",
				params: [hash],
			}),
		);
	}

	/**
	 * Watch for pending transactions
	 * @param {WatchPendingOptions} [opts]
	 * @returns {AsyncGenerator<PendingTransactionEvent>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
	async function* watchPending(opts = {}) {
		const { filter, pollingInterval = DEFAULT_POLLING_INTERVAL, signal } = opts;
		const seenHashes = new Set();

		while (!signal?.aborted) {
			try {
				// Get pending transactions using eth_pendingTransactions or eth_subscribe
				// Note: Not all nodes support eth_pendingTransactions
				const pendingTxs = /** @type {any[]} */ (
					await provider
						.request(/** @type {any} */ ({ method: "eth_pendingTransactions" }))
						.catch(() => [])
				);

				const chainHead = await getBlockNumber();

				for (const tx of /** @type {any[]} */ (pendingTxs) || []) {
					if (!tx?.hash || seenHashes.has(tx.hash)) continue;
					seenHashes.add(tx.hash);

					const parsed = parsePendingTransaction(tx);
					if (!matchesFilter(parsed, filter)) continue;

					yield/** @type {PendingTransactionEvent} */ ({
						type: "pending",
						transaction: parsed,
						metadata: { chainHead, timestamp: Date.now() },
					});
				}

				// Clean up old hashes to prevent memory leak
				if (seenHashes.size > 10000) {
					const hashes = Array.from(seenHashes);
					for (let i = 0; i < 5000; i++) {
						seenHashes.delete(hashes[i]);
					}
				}
			} catch {
				// Continue on errors
			}

			await sleep(pollingInterval);
		}
	}

	/**
	 * Watch for confirmed transactions
	 * @param {WatchConfirmedOptions} [opts]
	 * @returns {AsyncGenerator<ConfirmedTransactionEvent>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
	async function* watchConfirmed(opts = {}) {
		const {
			filter,
			pollingInterval = DEFAULT_POLLING_INTERVAL,
			fromBlock,
			confirmations = 1,
			signal,
		} = opts;

		let lastBlock = fromBlock ?? (await getBlockNumber());

		while (!signal?.aborted) {
			try {
				const chainHead = await getBlockNumber();
				const confirmedBlock = chainHead - BigInt(confirmations - 1);

				// Process new blocks
				while (lastBlock <= confirmedBlock && !signal?.aborted) {
					const block = await provider.request(
						/** @type {any} */ ({
							method: "eth_getBlockByNumber",
							params: [`0x${lastBlock.toString(16)}`, true],
						}),
					);

					if (!block) break;

					const blockData = /** @type {any} */ (block);
					const transactions = blockData.transactions || [];

					for (const tx of transactions) {
						if (typeof tx === "string") continue; // Only hash, skip

						const parsed = parsePendingTransaction(tx);
						if (!matchesFilter(parsed, filter)) continue;

						// Get receipt
						const receipt = await getReceipt(tx.hash);
						if (!receipt) continue;

						const receiptData = /** @type {any} */ (receipt);

						/** @type {ConfirmedTransaction} */
						const confirmed = {
							...parsed,
							blockHash:
								/** @type {import('../primitives/BlockHash/BlockHashType.js').BlockHashType} */ (
									hexToBytes(blockData.hash)
								),
							blockNumber: BigInt(blockData.number),
							transactionIndex: Number.parseInt(tx.transactionIndex, 16),
							receipt: /** @type {any} */ ({
								transactionHash: hexToBytes(receiptData.transactionHash),
								transactionIndex: Number.parseInt(
									receiptData.transactionIndex,
									16,
								),
								blockHash: hexToBytes(receiptData.blockHash),
								blockNumber: BigInt(receiptData.blockNumber),
								from: hexToBytes(receiptData.from),
								to: receiptData.to ? hexToBytes(receiptData.to) : null,
								cumulativeGasUsed: BigInt(receiptData.cumulativeGasUsed),
								gasUsed: BigInt(receiptData.gasUsed),
								contractAddress: receiptData.contractAddress
									? hexToBytes(receiptData.contractAddress)
									: null,
								logs: [],
								logsBloom: hexToBytes(receiptData.logsBloom),
								status: receiptData.status === "0x1" ? 1 : 0,
								effectiveGasPrice: BigInt(
									receiptData.effectiveGasPrice || "0x0",
								),
								type: getTransactionType(receiptData.type),
							}),
						};

						yield/** @type {ConfirmedTransactionEvent} */ ({
							type: "confirmed",
							transaction: confirmed,
							metadata: { chainHead, timestamp: Date.now() },
						});
					}

					lastBlock++;
				}
			} catch {
				// Continue on errors
			}

			await sleep(pollingInterval);
		}
	}

	/**
	 * Track a specific transaction
	 * @param {Uint8Array | string} txHash
	 * @param {TrackOptions} [opts]
	 * @returns {AsyncGenerator<TransactionStreamEvent>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: streaming logic
	async function* track(txHash, opts = {}) {
		const {
			pollingInterval = DEFAULT_POLLING_INTERVAL,
			timeout = DEFAULT_TIMEOUT,
			confirmations = 1,
			signal,
		} = opts;

		const hashHex = typeof txHash === "string" ? txHash : bytesToHex(txHash);
		const startTime = Date.now();
		let lastState = /** @type {"unknown" | "pending" | "confirmed"} */ (
			"unknown"
		);

		while (!signal?.aborted) {
			// Check timeout
			if (Date.now() - startTime > timeout) {
				const chainHead = await getBlockNumber();
				yield/** @type {import('./TransactionStreamType.js').DroppedTransactionEvent} */ ({
					type: "dropped",
					hash: hexToBytes(hashHex),
					reason: "timeout",
					metadata: { chainHead, timestamp: Date.now() },
				});
				return;
			}

			try {
				const chainHead = await getBlockNumber();
				const tx = await getTransaction(hashHex);

				if (!tx) {
					// Transaction not found - might be dropped
					if (lastState === "pending") {
						yield/** @type {import('./TransactionStreamType.js').DroppedTransactionEvent} */ ({
							type: "dropped",
							hash: hexToBytes(hashHex),
							reason: "unknown",
							metadata: { chainHead, timestamp: Date.now() },
						});
						return;
					}
				} else {
					const txData = /** @type {any} */ (tx);

					if (txData.blockNumber) {
						// Transaction is mined
						const blockNumber = BigInt(txData.blockNumber);
						const confirms = chainHead - blockNumber + 1n;

						if (confirms >= BigInt(confirmations)) {
							const receipt = await getReceipt(hashHex);
							if (receipt) {
								const receiptData = /** @type {any} */ (receipt);
								const parsed = parsePendingTransaction(txData);

								/** @type {ConfirmedTransaction} */
								const confirmed = {
									...parsed,
									blockHash:
										/** @type {import('../primitives/BlockHash/BlockHashType.js').BlockHashType} */ (
											hexToBytes(txData.blockHash)
										),
									blockNumber,
									transactionIndex: Number.parseInt(
										txData.transactionIndex,
										16,
									),
									receipt: /** @type {any} */ ({
										transactionHash: hexToBytes(receiptData.transactionHash),
										transactionIndex: Number.parseInt(
											receiptData.transactionIndex,
											16,
										),
										blockHash: hexToBytes(receiptData.blockHash),
										blockNumber: BigInt(receiptData.blockNumber),
										from: hexToBytes(receiptData.from),
										to: receiptData.to ? hexToBytes(receiptData.to) : null,
										cumulativeGasUsed: BigInt(receiptData.cumulativeGasUsed),
										gasUsed: BigInt(receiptData.gasUsed),
										contractAddress: receiptData.contractAddress
											? hexToBytes(receiptData.contractAddress)
											: null,
										logs: [],
										logsBloom: hexToBytes(receiptData.logsBloom),
										status: receiptData.status === "0x1" ? 1 : 0,
										effectiveGasPrice: BigInt(
											receiptData.effectiveGasPrice || "0x0",
										),
										type: getTransactionType(receiptData.type),
									}),
								};

								yield/** @type {ConfirmedTransactionEvent} */ ({
									type: "confirmed",
									transaction: confirmed,
									metadata: { chainHead, timestamp: Date.now() },
								});
								return;
							}
						}
					} else {
						// Transaction is pending
						if (lastState !== "pending") {
							lastState = "pending";
							const parsed = parsePendingTransaction(txData);

							yield/** @type {PendingTransactionEvent} */ ({
								type: "pending",
								transaction: parsed,
								metadata: { chainHead, timestamp: Date.now() },
							});
						}
					}
				}
			} catch {
				// Continue on errors
			}

			await sleep(pollingInterval);
		}
	}

	return {
		watchPending,
		watchConfirmed,
		track,
	};
}
