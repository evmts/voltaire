/**
 * getBlock Action
 *
 * Returns information about a block.
 *
 * @module examples/viem-publicclient/actions/getBlock
 */

import { BlockNotFoundError } from "../errors.js";
import { numberToHex, hexToBigInt, hexToNumber } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetBlockParameters} GetBlockParameters
 * @typedef {import('../PublicClientType.js').Block} Block
 */

/**
 * Format raw block response
 *
 * @param {any} block - Raw block from RPC
 * @returns {Block} Formatted block
 */
function formatBlock(block) {
	return {
		baseFeePerGas: block.baseFeePerGas ? hexToBigInt(block.baseFeePerGas) : undefined,
		blobGasUsed: block.blobGasUsed ? hexToBigInt(block.blobGasUsed) : undefined,
		difficulty: block.difficulty ? hexToBigInt(block.difficulty) : undefined,
		excessBlobGas: block.excessBlobGas ? hexToBigInt(block.excessBlobGas) : undefined,
		extraData: block.extraData,
		gasLimit: hexToBigInt(block.gasLimit),
		gasUsed: hexToBigInt(block.gasUsed),
		hash: block.hash,
		logsBloom: block.logsBloom,
		miner: block.miner,
		mixHash: block.mixHash,
		nonce: block.nonce,
		number: block.number ? hexToBigInt(block.number) : null,
		parentBeaconBlockRoot: block.parentBeaconBlockRoot,
		parentHash: block.parentHash,
		receiptsRoot: block.receiptsRoot,
		sha3Uncles: block.sha3Uncles,
		size: hexToBigInt(block.size),
		stateRoot: block.stateRoot,
		timestamp: hexToBigInt(block.timestamp),
		totalDifficulty: block.totalDifficulty ? hexToBigInt(block.totalDifficulty) : undefined,
		transactions: block.transactions,
		transactionsRoot: block.transactionsRoot,
		uncles: block.uncles ?? [],
		withdrawals: block.withdrawals?.map((w) => ({
			index: hexToBigInt(w.index),
			validatorIndex: hexToBigInt(w.validatorIndex),
			address: w.address,
			amount: hexToBigInt(w.amount),
		})),
		withdrawalsRoot: block.withdrawalsRoot,
	};
}

/**
 * Get block information
 *
 * @param {Client} client - Client instance
 * @param {GetBlockParameters} [params] - Parameters
 * @returns {Promise<Block>} Block data
 *
 * @example
 * ```typescript
 * const block = await getBlock(client, { blockNumber: 19123456n });
 * console.log(block.timestamp);
 * ```
 */
export async function getBlock(client, params = {}) {
	const { blockHash, blockNumber, blockTag = "latest", includeTransactions = false } = params;

	let block;

	if (blockHash) {
		block = await client.request({
			method: "eth_getBlockByHash",
			params: [blockHash, includeTransactions],
		});
	} else {
		const blockId = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : blockTag;
		block = await client.request({
			method: "eth_getBlockByNumber",
			params: [blockId, includeTransactions],
		});
	}

	if (!block) {
		throw new BlockNotFoundError({ blockHash, blockNumber });
	}

	return formatBlock(block);
}
