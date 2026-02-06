/**
 * @fileoverview net_peerCount JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns number of peers currently connected to the client.
 *
 * @example
 * Result: "0x2"
 *
 * Implements the `net_peerCount` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "net_peerCount";

/**
 * Result for `net_peerCount`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a net_peerCount JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function PeerCountRequest() {
	return { method };
}
