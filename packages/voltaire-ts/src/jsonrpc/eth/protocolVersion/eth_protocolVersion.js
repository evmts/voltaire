/**
 * @fileoverview eth_protocolVersion JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the current ethereum protocol version.
 *
 * @example
 * Result: "0x41"
 *
 * Implements the `eth_protocolVersion` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_protocolVersion";

/**
 * Result for `eth_protocolVersion`
 *
 * String of the current protocol version
 *
 * @typedef {string} Result
 */

/**
 * Creates an eth_protocolVersion JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function ProtocolVersionRequest() {
	return { method };
}
