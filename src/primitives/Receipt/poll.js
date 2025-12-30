/**
 * Poll for transaction receipt
 *
 * @module primitives/Receipt/poll
 */

import { pollForReceipt as _pollForReceipt } from "../../utils/poll.js";

/**
 * @typedef {import('./ReceiptType.js').ReceiptType} ReceiptType
 */

/**
 * Poll options for receipt
 */
/** @typedef {{ interval?: number; timeout?: number; confirmations?: number }} PollReceiptOptions */

/**
 * Poll for a transaction receipt until it's available
 *
 * Uses exponential backoff and handles transient RPC errors gracefully.
 *
 * @param {string} txHash - Transaction hash to poll for
 * @param {{ request(args: { method: string; params?: unknown[] }): Promise<unknown> }} provider - EIP-1193 provider
 * @param {PollReceiptOptions} [options] - Polling options
 * @returns {Promise<ReceiptType>} Transaction receipt
 * @throws {Error} If timeout is reached before receipt is available
 *
 * @example
 * ```typescript
 * import { poll } from '@tevm/voltaire/Receipt';
 *
 * // Wait for transaction confirmation
 * const receipt = await poll(txHash, provider);
 * console.log(`Status: ${receipt.status}`);
 *
 * // With custom options
 * const receipt = await poll(txHash, provider, {
 *   interval: 2000,      // Poll every 2s
 *   timeout: 120000,     // Wait up to 2 minutes
 *   confirmations: 3     // Wait for 3 confirmations
 * });
 * ```
 */
export async function poll(txHash, provider, options = {}) {
	const { interval = 1000, timeout = 60000, confirmations = 1 } = options;

	/**
	 * @param {string} hash
	 * @returns {Promise<ReceiptType | null>}
	 */
	async function getReceipt(hash) {
		const result = await provider.request({
			method: "eth_getTransactionReceipt",
			params: [hash],
		});

		if (!result) return null;

		const receipt = /** @type {any} */ (result);

		// Check confirmations if required
		if (confirmations > 1) {
			const latestBlock = await provider.request({
				method: "eth_blockNumber",
			});
			const currentBlock = BigInt(/** @type {string} */ (latestBlock));
			const receiptBlock = BigInt(receipt.blockNumber);
			const confirms = currentBlock - receiptBlock + 1n;

			if (confirms < BigInt(confirmations)) {
				return null; // Not enough confirmations yet
			}
		}

		// Convert RPC response to ReceiptType
		return /** @type {ReceiptType} */ ({
			transactionHash: hexToBytes(receipt.transactionHash),
			transactionIndex: Number(receipt.transactionIndex),
			blockHash: hexToBytes(receipt.blockHash),
			blockNumber: BigInt(receipt.blockNumber),
			from: hexToBytes(receipt.from),
			to: receipt.to ? hexToBytes(receipt.to) : null,
			cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed),
			gasUsed: BigInt(receipt.gasUsed),
			contractAddress: receipt.contractAddress
				? hexToBytes(receipt.contractAddress)
				: null,
			logs: (receipt.logs || []).map(parseLog),
			logsBloom: hexToBytes(receipt.logsBloom),
			status: receipt.status ? (receipt.status === "0x1" ? 1 : 0) : undefined,
			root: receipt.root ? hexToBytes(receipt.root) : undefined,
			effectiveGasPrice: BigInt(
				receipt.effectiveGasPrice || receipt.gasPrice || "0x0",
			),
			type: getTransactionType(receipt.type),
			blobGasUsed: receipt.blobGasUsed
				? BigInt(receipt.blobGasUsed)
				: undefined,
			blobGasPrice: receipt.blobGasPrice
				? BigInt(receipt.blobGasPrice)
				: undefined,
		});
	}

	return _pollForReceipt(txHash, getReceipt, { interval, timeout });
}

/**
 * Convert hex string to Uint8Array
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Parse log from RPC response
 * @param {any} log
 * @returns {import('../EventLog/EventLogType.js').EventLogType}
 */
function parseLog(log) {
	return /** @type {any} */ ({
		address: hexToBytes(log.address),
		topics: log.topics.map(hexToBytes),
		data: hexToBytes(log.data),
		blockNumber: BigInt(log.blockNumber),
		blockHash: hexToBytes(log.blockHash),
		transactionHash: hexToBytes(log.transactionHash),
		transactionIndex: Number(log.transactionIndex),
		logIndex: Number(log.logIndex),
		removed: log.removed || false,
	});
}

/**
 * Get transaction type string
 * @param {string | undefined} typeHex
 * @returns {"legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702"}
 */
function getTransactionType(typeHex) {
	if (!typeHex) return "legacy";
	const type = Number.parseInt(typeHex, 16);
	switch (type) {
		case 0:
			return "legacy";
		case 1:
			return "eip2930";
		case 2:
			return "eip1559";
		case 3:
			return "eip4844";
		case 4:
			return "eip7702";
		default:
			return "legacy";
	}
}
