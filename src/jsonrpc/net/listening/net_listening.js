/**
 * @fileoverview net_listening JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns true if client is actively listening for network connections.
 *
 * @example
 * Result: true
 *
 * Implements the `net_listening` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "net_listening";

/**
 * Result for `net_listening`
 *
 * @typedef {boolean} Result
 */

/**
 * Creates a net_listening JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function ListeningRequest() {
	return { method };
}
