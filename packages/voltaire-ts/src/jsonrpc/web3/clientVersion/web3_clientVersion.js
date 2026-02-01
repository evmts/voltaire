/**
 * @fileoverview web3_clientVersion JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the current client version.
 *
 * @example
 * Result: "Geth/v1.12.0-unstable/linux-amd64/go1.19.1"
 *
 * Implements the `web3_clientVersion` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "web3_clientVersion";

/**
 * Result for `web3_clientVersion`
 *
 * @typedef {string} Result
 */

/**
 * Creates a web3_clientVersion JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function ClientVersionRequest() {
	return { method };
}
