/**
 * @fileoverview eth_getProof JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the merkle proof for a given account and optionally some storage keys.
 *
 * @example
 * Address: "0xe5cB067E90D5Cd1F8052B83562Ae670bA4A211a8"
 * StorageKeys: ...
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_getProof` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getProof";
/**
 * Result for `eth_getProof`
 *
 * Account proof
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getProof JSON-RPC request
 *
 * @param {Address} address
 * @param {`0x${string}`[]} storageKeys
 * @param {BlockSpec} [block]
 * @returns {RequestArguments}
 */
export function GetProofRequest(address, storageKeys, block = "latest") {
	return { method, params: [address, storageKeys, block] };
}
