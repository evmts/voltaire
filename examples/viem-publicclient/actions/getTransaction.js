/**
 * getTransaction Action
 *
 * Returns information about a transaction.
 *
 * @module examples/viem-publicclient/actions/getTransaction
 */

import { TransactionNotFoundError } from "../errors.js";
import { numberToHex, hexToBigInt } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetTransactionParameters} GetTransactionParameters
 * @typedef {import('../PublicClientType.js').Transaction} Transaction
 */

/**
 * Format raw transaction response
 *
 * @param {any} tx - Raw transaction from RPC
 * @returns {Transaction} Formatted transaction
 */
function formatTransaction(tx) {
	return {
		blockHash: tx.blockHash,
		blockNumber: tx.blockNumber ? hexToBigInt(tx.blockNumber) : null,
		from: tx.from,
		gas: hexToBigInt(tx.gas),
		gasPrice: tx.gasPrice ? hexToBigInt(tx.gasPrice) : undefined,
		maxFeePerGas: tx.maxFeePerGas ? hexToBigInt(tx.maxFeePerGas) : undefined,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? hexToBigInt(tx.maxPriorityFeePerGas) : undefined,
		hash: tx.hash,
		input: tx.input,
		nonce: Number(hexToBigInt(tx.nonce)),
		to: tx.to,
		transactionIndex: tx.transactionIndex ? Number(hexToBigInt(tx.transactionIndex)) : null,
		value: hexToBigInt(tx.value),
		type: tx.type,
		accessList: tx.accessList,
		chainId: tx.chainId ? Number(hexToBigInt(tx.chainId)) : undefined,
		v: hexToBigInt(tx.v),
		r: tx.r,
		s: tx.s,
	};
}

/**
 * Get transaction by hash or block index
 *
 * @param {Client} client - Client instance
 * @param {GetTransactionParameters} params - Parameters
 * @returns {Promise<Transaction>} Transaction data
 *
 * @example
 * ```typescript
 * const tx = await getTransaction(client, {
 *   hash: '0x...'
 * });
 * ```
 */
export async function getTransaction(client, params) {
	const { hash, blockHash, blockNumber, blockTag = "latest", index } = params;

	let transaction = null;

	if (hash) {
		transaction = await client.request({
			method: "eth_getTransactionByHash",
			params: [hash],
		});
	} else if (blockHash && typeof index === "number") {
		transaction = await client.request({
			method: "eth_getTransactionByBlockHashAndIndex",
			params: [blockHash, numberToHex(BigInt(index))],
		});
	} else if ((blockNumber !== undefined || blockTag) && typeof index === "number") {
		const blockId = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : blockTag;
		transaction = await client.request({
			method: "eth_getTransactionByBlockNumberAndIndex",
			params: [blockId, numberToHex(BigInt(index))],
		});
	}

	if (!transaction) {
		throw new TransactionNotFoundError({ hash, blockHash, blockNumber, index });
	}

	return formatTransaction(transaction);
}
