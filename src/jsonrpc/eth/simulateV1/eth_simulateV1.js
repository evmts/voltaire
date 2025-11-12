/**
 * @fileoverview eth_simulateV1 JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Executes a sequence of message calls building on each other's state without creating transactions on the block chain, optionally overriding block and state data
 *
 * Implements the `eth_simulateV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_simulateV1";
/**
 * Result for `eth_simulateV1`
 *
 * Full results of eth_simulate
 *
 * @typedef {Quantity} Result
 */
