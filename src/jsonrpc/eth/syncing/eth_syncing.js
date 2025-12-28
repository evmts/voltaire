/**
 * @fileoverview eth_syncing JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns an object with data about the sync status or false.
 *
 * @example
 * Result: ...
 *
 * Implements the `eth_syncing` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_syncing";
/**
 * Result for `eth_syncing`
 *
 * Syncing status
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_syncing JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function SyncingRequest() {
	return { method };
}
