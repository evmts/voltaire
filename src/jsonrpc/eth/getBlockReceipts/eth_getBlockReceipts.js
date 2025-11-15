/**
 * @fileoverview eth_getBlockReceipts JSON-RPC method
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
 * Returns the receipts of a block by number or hash.
 *
 * @example
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_getBlockReceipts` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockReceipts";
/**
 * Result for `eth_getBlockReceipts`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getBlockReceipts`
 *
 * @typedef {JsonRpcRequest<'eth_getBlockReceipts', [BlockSpec]>} Request
 */

/**
 * Creates a eth_getBlockReceipts JSON-RPC request
 *
 * @param {BlockSpec} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetBlockReceiptsRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
