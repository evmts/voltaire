/**
 * @fileoverview eth_call JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
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
 * Creates an eth_call JSON-RPC request
 *
 * @param {CallParams} params - Transaction call parameters
 * @param {BlockSpec} [block='latest'] - Block number, tag, or block hash
 * @returns {RequestArguments}
 *
 * @example
 * ```js
 * const request = CallRequest({
 *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *   data: '0x...'
 * }, 'latest')
 * ```
 */
export function CallRequest(params, block = "latest") {
	return { method, params: [params, block] };
}
