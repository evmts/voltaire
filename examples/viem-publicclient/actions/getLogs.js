/**
 * getLogs Action
 *
 * Returns logs matching filter criteria.
 *
 * @module examples/viem-publicclient/actions/getLogs
 */

import { numberToHex, hexToBigInt, normalizeAddress } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetLogsParameters} GetLogsParameters
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
 * Get logs matching filter
 *
 * @param {Client} client - Client instance
 * @param {GetLogsParameters} [params] - Parameters
 * @returns {Promise<Log[]>} Matching logs
 *
 * @example
 * ```typescript
 * const logs = await getLogs(client, {
 *   address: '0x...',
 *   fromBlock: 19000000n,
 *   toBlock: 19000100n
 * });
 * ```
 */
export async function getLogs(client, params = {}) {
	const { address, fromBlock, toBlock, blockHash, topics } = params;

	/** @type {Record<string, unknown>} */
	const filter = {};

	if (address) {
		if (Array.isArray(address)) {
			filter.address = address.map(normalizeAddress);
		} else {
			filter.address = normalizeAddress(address);
		}
	}

	if (topics) {
		filter.topics = topics;
	}

	if (blockHash) {
		filter.blockHash = blockHash;
	} else {
		if (fromBlock !== undefined) {
			filter.fromBlock = typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock;
		}
		if (toBlock !== undefined) {
			filter.toBlock = typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock;
		}
	}

	const logs = await client.request({
		method: "eth_getLogs",
		params: [filter],
	});

	return /** @type {any[]} */ (logs).map(formatLog);
}
