/**
 * @fileoverview eth_createAccessList JSON-RPC method
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
 * Generates an access list for a transaction.
 *
 * @example
 * Transaction: ...
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_createAccessList` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_createAccessList";
/**
 * Result for `eth_createAccessList`
 *
 * Access list result
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_createAccessList`
 *
 * @typedef {JsonRpcRequest<'eth_createAccessList', [CallParams, BlockSpec]>} Request
 */

/**
 * Creates a eth_createAccessList JSON-RPC request
 *
 * @param {CallParams} address
 * @param {BlockSpec} [block]
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function CreateAccessListRequest(address, block = "latest", id = null) {
	return /** @type {Request} */ (createRequest(method, [address, block], id));
}
