/**
 * @fileoverview eth_getFilterChanges JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Polling method for the filter with the given ID (created using `eth_newFilter`). Returns an array of logs, block hashes, or transaction hashes since last poll, depending on the installed filter.
 *
 * @example
 * Filter identifier: "0x01"
 * Result: ...
 *
 * Implements the `eth_getFilterChanges` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getFilterChanges";
/**
 * Result for `eth_getFilterChanges`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */
