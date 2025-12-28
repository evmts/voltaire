/**
 * @fileoverview debug_getBadBlocks JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
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
