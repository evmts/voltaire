/**
 * @fileoverview eth_getLogs JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an array of all logs matching the specified filter.
 *
 * @example
 * Filter: ...
 * Result: ...
 *
 * Implements the `eth_getLogs` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getLogs";
/**
 * Result for `eth_getLogs`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */
