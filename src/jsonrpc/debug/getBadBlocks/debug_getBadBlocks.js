/**
 * @fileoverview debug_getBadBlocks JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an array of recent bad blocks that the client has seen on the network.
 *
 * @example
 * Result: ...
 *
 * Implements the `debug_getBadBlocks` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "debug_getBadBlocks";
/**
 * Result for `debug_getBadBlocks`
 *
 * Bad block array
 *
 * @typedef {Quantity} Result
 */
