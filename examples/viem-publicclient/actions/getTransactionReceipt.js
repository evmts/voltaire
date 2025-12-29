/**
 * getTransactionReceipt Action
 *
 * Returns the receipt of a transaction.
 *
 * @module examples/viem-publicclient/actions/getTransactionReceipt
 */

import { TransactionNotFoundError } from "../errors.js";
import { hexToBigInt } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetTransactionReceiptParameters} GetTransactionReceiptParameters
 * @typedef {import('../PublicClientType.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('../PublicClientType.js').Log} Log
 */

/**
 * Format raw log response
 *
 * @param {any} log - Raw log from RPC
 * @returns {Log} Formatted log
 */
function formatLog(log) {
	return {
		address: log.address,
		blockHash: log.blockHash,
		blockNumber: log.blockNumber ? hexToBigInt(log.blockNumber) : null,
		data: log.data,
		logIndex: log.logIndex ? Number(hexToBigInt(log.logIndex)) : null,
		removed: log.removed ?? false,
		topics: log.topics,
		transactionHash: log.transactionHash,
		transactionIndex: log.transactionIndex ? Number(hexToBigInt(log.transactionIndex)) : null,
	};
}

/**
 * Format raw receipt response
 *
 * @param {any} receipt - Raw receipt from RPC
 * @returns {TransactionReceipt} Formatted receipt
 */
function formatReceipt(receipt) {
	return {
		blockHash: receipt.blockHash,
		blockNumber: hexToBigInt(receipt.blockNumber),
		contractAddress: receipt.contractAddress,
		cumulativeGasUsed: hexToBigInt(receipt.cumulativeGasUsed),
		effectiveGasPrice: hexToBigInt(receipt.effectiveGasPrice),
		from: receipt.from,
		gasUsed: hexToBigInt(receipt.gasUsed),
		logs: receipt.logs.map(formatLog),
		logsBloom: receipt.logsBloom,
		status: receipt.status === "0x1" ? "success" : "reverted",
		to: receipt.to,
		transactionHash: receipt.transactionHash,
		transactionIndex: Number(hexToBigInt(receipt.transactionIndex)),
		type: receipt.type,
	};
}

/**
 * Get transaction receipt
 *
 * @param {Client} client - Client instance
 * @param {GetTransactionReceiptParameters} params - Parameters
 * @returns {Promise<TransactionReceipt>} Receipt data
 *
 * @example
 * ```typescript
 * const receipt = await getTransactionReceipt(client, {
 *   hash: '0x...'
 * });
 * console.log(receipt.status); // 'success' | 'reverted'
 * ```
 */
export async function getTransactionReceipt(client, { hash }) {
	const receipt = await client.request({
		method: "eth_getTransactionReceipt",
		params: [hash],
	});

	if (!receipt) {
		throw new TransactionNotFoundError({ hash });
	}

	return formatReceipt(receipt);
}
