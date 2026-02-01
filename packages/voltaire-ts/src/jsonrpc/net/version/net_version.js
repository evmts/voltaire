/**
 * @fileoverview net_version JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the current network id.
 *
 * @example
 * Result: "1" (Mainnet)
 *
 * Implements the `net_version` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "net_version";

/**
 * Result for `net_version`
 *
 * @typedef {string} Result
 */

/**
 * Creates a net_version JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function VersionRequest() {
	return { method };
}
