/**
 * @fileoverview eth_getBlockByHash JSON-RPC method
 */

import { createRequest } from "../../types/JsonRpcRequest.js";

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest
 */

/**
 * Returns information about a block by hash.
 *
 * @example
 * Block hash: "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c"
 * Hydrated transactions: false
 * Result: ...
 *
 * Implements the `eth_getBlockByHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockByHash";
/**
 * Result for `eth_getBlockByHash`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getBlockByHash`
 *
 * @typedef {JsonRpcRequest<'eth_getBlockByHash', [Hash, boolean]>} Request
 */

/**
 * Creates a eth_getBlockByHash JSON-RPC request
 *
 * @param {Hash} blockHash - Block hash
 * @param {boolean} [fullTransactions=false] - If true, returns full transaction objects
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetBlockByHashRequest(
	blockHash,
	fullTransactions = false,
	id = null,
) {
	return /** @type {Request} */ (
		createRequest(method, [blockHash, fullTransactions], id)
	);
}
