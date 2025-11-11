/**
 * @fileoverview eth_getUncleCountByBlockHash JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
export const method = 'eth_getUncleCountByBlockHash'

/**
 * Parameters for `eth_getUncleCountByBlockHash`
 *
 * @typedef {Object} Params
 * @property {Hash} block hash - 32 byte hex value
 */

export {}
/**
 * Result for `eth_getUncleCountByBlockHash`
 *
 * @typedef {Quantity} Result
 */
