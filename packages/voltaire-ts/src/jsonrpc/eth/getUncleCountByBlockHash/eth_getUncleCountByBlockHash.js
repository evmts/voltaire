/**
 * @fileoverview eth_getUncleCountByBlockHash JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the number of uncles in a block from a block matching the given block hash.
 *
 * @example
 * Block hash: "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35"
 * Result: "0x1"
 *
 * Implements the `eth_getUncleCountByBlockHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getUncleCountByBlockHash";
/**
 * Result for `eth_getUncleCountByBlockHash`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getUncleCountByBlockHash JSON-RPC request
 *
 * @param {Hash} address
 * @returns {RequestArguments}
 */
export function GetUncleCountByBlockHashRequest(address) {
	return { method, params: [address] };
}
