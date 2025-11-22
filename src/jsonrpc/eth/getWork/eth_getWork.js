/**
 * @fileoverview eth_getWork JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Data} Data
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the hash of the current block, the seedHash, and the boundary condition to be met ("target").
 *
 * @example
 * Result: ["0x1234...", "0x5678...", "0x9abc..."]
 *
 * Implements the `eth_getWork` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getWork";

/**
 * Result for `eth_getWork`
 *
 * Array of [current block header pow-hash, seed hash for DAG, boundary condition ("target")]
 *
 * @typedef {[Data, Data, Data]} Result
 */

/**
 * Creates an eth_getWork JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function GetWorkRequest() {
	return { method };
}
