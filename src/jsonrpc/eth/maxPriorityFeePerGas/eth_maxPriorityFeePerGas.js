/**
 * @fileoverview eth_maxPriorityFeePerGas JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the current maxPriorityFeePerGas per gas in wei.
 *
 * @example
 * Result: "0x773c23ba"
 *
 * Implements the `eth_maxPriorityFeePerGas` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'eth_maxPriorityFeePerGas'

/**
 * Parameters for `eth_maxPriorityFeePerGas`
 *
 * @typedef {Object} Params
 */

export {}
/**
 * Result for `eth_maxPriorityFeePerGas`
 *
 * Max priority fee per gas
 *
 * @typedef {Quantity} Result
 */
