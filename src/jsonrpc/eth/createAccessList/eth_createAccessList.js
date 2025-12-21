/**
 * @fileoverview eth_createAccessList JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 * @typedef {import('../call/eth_call.js').CallParams} CallParams
 */

/**
 * Generates an access list for a transaction.
 *
 * @example
 * Transaction: ...
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_createAccessList` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_createAccessList";
/**
 * Result for `eth_createAccessList`
 *
 * Access list result
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_createAccessList JSON-RPC request
 *
 * @param {CallParams} address
 * @param {BlockSpec} [block]
 * @returns {RequestArguments}
 */
export function CreateAccessListRequest(address, block = "latest") {
	return { method, params: [address, block] };
}
