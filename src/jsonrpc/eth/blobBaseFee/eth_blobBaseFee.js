/**
 * @fileoverview eth_blobBaseFee JSON-RPC method
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
 * Returns the base fee per blob gas in wei.
 *
 * @example
 * Result: "0x3f5694c1f"
 *
 * Implements the `eth_blobBaseFee` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_blobBaseFee";
/**
 * Result for `eth_blobBaseFee`
 *
 * Blob gas base fee
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_blobBaseFee`
 *
 * @typedef {JsonRpcRequest<'eth_blobBaseFee', []>} Request
 */

/**
 * Creates a eth_blobBaseFee JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function BlobBaseFeeRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
