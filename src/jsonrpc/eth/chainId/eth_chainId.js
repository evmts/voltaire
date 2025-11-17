/**
 * @fileoverview eth_chainId JSON-RPC method
 */

import { createRequest } from "../../types/JsonRpcRequest.js";

/**
 * @typedef {import('../../types/index.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest
 */

/**
 * Returns the chain ID of the current network.
 *
 * @example
 * Result: "0x1"
 *
 * Implements the `eth_chainId` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_chainId";
/**
 * Result for `eth_chainId`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_chainId`
 *
 * @typedef {JsonRpcRequest<'eth_chainId', []>} Request
 */

/**
 * Creates a eth_chainId JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function ChainIdRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
