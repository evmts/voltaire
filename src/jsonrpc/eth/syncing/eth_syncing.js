/**
 * @fileoverview eth_syncing JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
