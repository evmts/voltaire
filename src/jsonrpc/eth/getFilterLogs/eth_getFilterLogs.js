/**
 * @fileoverview eth_getFilterLogs JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an array of all logs matching the filter with the given ID (created using `eth_newFilter`).
 *
 * @example
 * Filter identifier: "0x01"
 * Result: ...
 *
 * Implements the `eth_getFilterLogs` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getFilterLogs";

/**
 * Parameters for `eth_getFilterLogs`
 *
 * @typedef {Object} Params
 * @property {Quantity} filter identifier - hex encoded unsigned integer
 */

export {};
/**
 * Result for `eth_getFilterLogs`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */
