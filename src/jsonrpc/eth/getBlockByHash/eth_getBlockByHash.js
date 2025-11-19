/**
 * @fileoverview eth_getBlockByHash JSON-RPC method
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
 * Creates a eth_getBlockByHash JSON-RPC request
 *
 * @param {Hash} blockHash - Block hash
 * @param {boolean} [fullTransactions=false] - If true, returns full transaction objects
 * @returns {RequestArguments}
 */
export function GetBlockByHashRequest(blockHash, fullTransactions = false) {
	return { method, params: [blockHash, fullTransactions] };
}
