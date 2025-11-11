/**
 * @fileoverview debug_getRawReceipts JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an array of EIP-2718 binary-encoded receipts.
 *
 * @example
 * Block: "0x32026E"
 * Result: ...
 *
 * Implements the `debug_getRawReceipts` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'debug_getRawReceipts'

/**
 * Parameters for `debug_getRawReceipts`
 *
 * @typedef {Object} Params
 * @property {Quantity} block - Block number or tag
 */

export {}
/**
 * Result for `debug_getRawReceipts`
 *
 * Receipt array
 *
 * @typedef {Quantity} Result
 */
