/**
 * @fileoverview eth_getProof JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
