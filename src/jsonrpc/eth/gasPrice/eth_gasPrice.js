/**
 * @fileoverview eth_gasPrice JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
 * Parameters for `eth_gasPrice`
 *
 * @typedef {Object} Params
 */

export {};
/**
 * Result for `eth_gasPrice`
 *
 * Gas price
 *
 * @typedef {Quantity} Result
 */
