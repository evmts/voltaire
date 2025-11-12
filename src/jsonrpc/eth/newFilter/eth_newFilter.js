/**
 * @fileoverview eth_newFilter JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Install a log filter in the server, allowing for later polling. Registers client interest in logs matching the filter, and returns an identifier.
 *
 * @example
 * Filter: ...
 * Result: "0x01"
 *
 * Implements the `eth_newFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newFilter";
/**
 * Result for `eth_newFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
