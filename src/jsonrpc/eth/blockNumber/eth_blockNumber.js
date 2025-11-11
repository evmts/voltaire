/**
 * @fileoverview eth_blockNumber JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the number of most recent block.
 *
 * @example
 * Result: "0x2377"
 *
 * Implements the `eth_blockNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_blockNumber";

/**
 * Parameters for `eth_blockNumber`
 *
 * @typedef {Object} Params
 */

export {};
/**
 * Result for `eth_blockNumber`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
