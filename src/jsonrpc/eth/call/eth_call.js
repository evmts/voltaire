/**
 * @fileoverview eth_call JSON-RPC method
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
 * Transaction call parameters
 *
 * @typedef {object} CallParams
 * @property {Address} [from] - Transaction sender
 * @property {Address} to - Transaction recipient
 * @property {Quantity} [gas] - Gas provided for transaction
 * @property {Quantity} [gasPrice] - Gas price
 * @property {Quantity} [value] - Value sent with transaction
 * @property {`0x${string}`} [data] - Call data
 */

/**
 * Executes a new message call immediately without creating a transaction on the block chain.
 *
 * @example
 * Transaction: ...
 * Block: "latest"
 * Result: "0x"
 *
 * Implements the `eth_call` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_call";

/**
 * Result for `eth_call`
 *
 * hex encoded bytes
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_call`
 *
 * @typedef {JsonRpcRequest<'eth_call', [CallParams, BlockSpec]>} Request
 */

/**
 * Creates an eth_call JSON-RPC request
 *
 * @param {CallParams} params - Transaction call parameters
 * @param {BlockSpec} [block='latest'] - Block number, tag, or block hash
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 *
 * @example
 * ```js
 * const request = CallRequest({
 *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *   data: '0x...'
 * }, 'latest')
 * ```
 */
export function CallRequest(params, block = "latest", id = null) {
	return /** @type {Request} */ (createRequest(method, [params, block], id));
}
