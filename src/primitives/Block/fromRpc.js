import { from as blockHashFrom } from "../BlockHash/index.js";
import { fromRpc as blockHeaderFromRpc } from "../BlockHeader/fromRpc.js";
import { fromRpc as transactionFromRpc } from "../Transaction/fromRpc.js";
import { from as uint256From } from "../Uint/index.js";
import { from as withdrawalFrom } from "../Withdrawal/index.js";

/**
 * Convert hex string to bigint, handling null/undefined
 * @param {string | null | undefined} hex
 * @returns {bigint}
 */
function hexToBigInt(hex) {
	if (!hex) return 0n;
	return BigInt(hex);
}

/**
 * @typedef {import('../BlockHeader/fromRpc.js').RpcBlockHeader} RpcBlockHeader
 */

/**
 * @typedef {Object} RpcWithdrawal
 * @property {string} index - Withdrawal index
 * @property {string} validatorIndex - Validator index
 * @property {string} address - Withdrawal recipient address
 * @property {string} amount - Amount in Gwei
 */

/**
 * @typedef {Object} RpcBlock
 * @property {string} hash - Block hash
 * @property {string} size - Block size in bytes
 * @property {string | null} [totalDifficulty] - Total difficulty (pre-merge)
 * @property {Array<import('../Transaction/fromRpc.js').RpcTransaction | string>} [transactions] - Transactions (full objects or hashes)
 * @property {string[]} [uncles] - Uncle block hashes
 * @property {RpcWithdrawal[]} [withdrawals] - Withdrawals (post-Shanghai)
 */

/**
 * @typedef {RpcBlock & RpcBlockHeader} RpcBlockResponse
 */

/**
 * Create Block from JSON-RPC response
 *
 * Converts hex-encoded RPC fields to appropriate internal types:
 * - Hex strings (0x...) to bigint for numeric fields
 * - Hex strings to Uint8Array for byte fields
 * - Parses transactions if full objects are included
 * - Maps RPC field names to internal names
 *
 * @see https://voltaire.tevm.sh/primitives/block for Block documentation
 * @since 0.1.42
 * @param {RpcBlockResponse} rpc - JSON-RPC eth_getBlockByNumber/eth_getBlockByHash response
 * @param {object} [options] - Options
 * @param {boolean} [options.includeTransactions=true] - Whether to parse transaction objects (false if response has tx hashes only)
 * @returns {import('./BlockType.js').BlockType} Block
 *
 * @example
 * ```javascript
 * import * as Block from './primitives/Block/index.js';
 *
 * // From eth_getBlockByNumber with full transactions
 * const block = Block.fromRpc({
 *   hash: "0x1a2b3c...",
 *   parentHash: "0xf1e2d3...",
 *   sha3Uncles: "0x1dcc4de8...",
 *   miner: "0x1f9090aa...",
 *   stateRoot: "0xa1b2c3...",
 *   transactionsRoot: "0xb2c3d4...",
 *   receiptsRoot: "0xc3d4e5...",
 *   logsBloom: "0x00000...",
 *   difficulty: "0x0",
 *   number: "0x12a7f27",
 *   gasLimit: "0x1c9c380",
 *   gasUsed: "0xd1a2b3",
 *   timestamp: "0x65e8c8b7",
 *   extraData: "0x",
 *   mixHash: "0x0000...",
 *   nonce: "0x0000000000000000",
 *   baseFeePerGas: "0x7a1225a00",
 *   size: "0xb1e2",
 *   totalDifficulty: "0xc70d815d562d3cfa955",
 *   transactions: [...],
 *   uncles: [],
 *   withdrawals: [...]
 * });
 * ```
 */
export function fromRpc(rpc, options = {}) {
	const { includeTransactions = true } = options;

	// Parse header fields
	const header = blockHeaderFromRpc(rpc);

	// Parse transactions
	/** @type {import('../Transaction/types.js').Any[]} */
	let transactions = [];
	if (rpc.transactions && rpc.transactions.length > 0) {
		if (includeTransactions && typeof rpc.transactions[0] === "object") {
			transactions = rpc.transactions.map((tx) =>
				transactionFromRpc(
					/** @type {import('../Transaction/fromRpc.js').RpcTransaction} */ (tx),
				),
			);
		}
		// If transactions are hashes (strings), we leave the array empty
		// as BlockBody.transactions expects Transaction objects, not hashes
	}

	// Parse withdrawals
	/** @type {import('../Withdrawal/WithdrawalType.js').WithdrawalType[] | undefined} */
	let withdrawals;
	if (rpc.withdrawals) {
		withdrawals = rpc.withdrawals.map((w) =>
			withdrawalFrom({
				index: hexToBigInt(w.index),
				validatorIndex: hexToBigInt(w.validatorIndex),
				address: w.address,
				amount: hexToBigInt(w.amount),
			}),
		);
	}

	// Build body
	/** @type {import('../BlockBody/BlockBodyType.js').BlockBodyType} */
	const body = {
		transactions,
		ommers: [], // RPC doesn't include full uncle blocks, only hashes
		...(withdrawals !== undefined && { withdrawals }),
	};

	// Build block
	/** @type {import('./BlockType.js').BlockType} */
	const block = {
		header,
		body,
		hash: blockHashFrom(rpc.hash),
		size: uint256From(hexToBigInt(rpc.size)),
		...(rpc.totalDifficulty !== undefined &&
			rpc.totalDifficulty !== null && {
				totalDifficulty: uint256From(hexToBigInt(rpc.totalDifficulty)),
			}),
	};

	return block;
}
