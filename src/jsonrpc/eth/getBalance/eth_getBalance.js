/**
 * @fileoverview eth_getBalance JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the balance of the account of given address.
 *
 * @example
 * Address: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
 * Block: "latest"
 * Result: "0x1cfe56f3795885980000"
 *
 * Implements the `eth_getBalance` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBalance";

/**
 * Result for `eth_getBalance`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates an eth_getBalance JSON-RPC request
 *
 * @param {Address | `0x${string}`} address - Hex encoded address
 * @param {BlockSpec} [block='latest'] - Block number, tag, or block hash
 * @returns {RequestArguments}
 *
 * @example
 * ```js
 * const request = GetBalanceRequest('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', 'latest')
 * // { jsonrpc: '2.0', method: 'eth_getBalance', params: [...], id: null }
 * ```
 */
export function GetBalanceRequest(address, block = "latest") {
	return { method, params: [address, block] };
}
