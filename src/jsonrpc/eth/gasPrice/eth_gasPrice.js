/**
 * @fileoverview eth_gasPrice JSON-RPC method
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
 * Returns the current price per gas in wei.
 *
 * @example
 * Result: "0x3e8"
 *
 * Implements the `eth_gasPrice` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_gasPrice";
/**
 * Result for `eth_gasPrice`
 *
 * Gas price
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_gasPrice`
 *
 * @typedef {JsonRpcRequest<'eth_gasPrice', []>} Request
 */

/**
 * Creates a eth_gasPrice JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GasPriceRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
