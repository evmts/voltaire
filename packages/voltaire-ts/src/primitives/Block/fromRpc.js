import { fromRpc as blockBodyFromRpc } from "../BlockBody/fromRpc.js";
import { fromRpc as blockHeaderFromRpc } from "../BlockHeader/fromRpc.js";
import { from } from "./from.js";

/**
 * @typedef {import('../BlockHeader/fromRpc.js').RpcBlockHeader} RpcBlockHeader
 * @typedef {import('../BlockBody/fromRpc.js').RpcBlockBody} RpcBlockBody
 */

/**
 * @typedef {RpcBlockHeader & RpcBlockBody & {
 *   hash: string,
 *   size: string,
 *   totalDifficulty?: string
 * }} RpcBlock
 */

/**
 * Convert RPC block format to Block
 *
 * Handles conversion of all hex-encoded strings from JSON-RPC to native types.
 * Includes header fields, body (transactions, withdrawals), and block metadata.
 *
 * @see https://voltaire.tevm.sh/primitives/block for Block documentation
 * @since 0.1.42
 * @param {RpcBlock} rpc - RPC block object (from eth_getBlockByNumber/Hash)
 * @returns {import('./BlockType.js').BlockType} Block
 * @throws {import('../errors/index.js').InvalidFormatError} If hex format is invalid
 * @throws {import('../errors/index.js').InvalidLengthError} If field length is incorrect
 * @throws {import('../errors/index.js').InvalidTransactionTypeError} If transaction type is unknown
 * @example
 * ```javascript
 * import * as Block from './primitives/Block/index.js';
 *
 * // From JSON-RPC response (eth_getBlockByNumber with full transactions)
 * const rpcBlock = await provider.send('eth_getBlockByNumber', ['latest', true]);
 * const block = Block.fromRpc(rpcBlock);
 *
 * console.log(block.header.number); // bigint
 * console.log(block.header.gasUsed); // bigint
 * console.log(block.body.transactions.length);
 * ```
 */
export function fromRpc(rpc) {
	const header = blockHeaderFromRpc(rpc);
	const body = blockBodyFromRpc(rpc);

	return from({
		header,
		body,
		hash: rpc.hash,
		size: BigInt(rpc.size),
		...(rpc.totalDifficulty !== undefined && {
			totalDifficulty: BigInt(rpc.totalDifficulty),
		}),
	});
}
