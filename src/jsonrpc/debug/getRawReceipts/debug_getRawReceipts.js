/**
 * @fileoverview debug_getRawReceipts JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
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
export const method = "debug_getRawReceipts";
/**
 * Result for `debug_getRawReceipts`
 *
 * Receipt array
 *
 * @typedef {Quantity} Result
 */
