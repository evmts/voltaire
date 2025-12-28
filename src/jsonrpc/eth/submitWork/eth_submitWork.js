/**
 * @fileoverview eth_submitWork JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Data} Data
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Used for submitting a proof-of-work solution.
 *
 * @example
 * Params: ["0x0000000000000001", "0x1234567890abcdef...", "0xd1fe1d1c3f...]
 * Result: true
 *
 * Implements the `eth_submitWork` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_submitWork";

/**
 * Result for `eth_submitWork`
 *
 * @typedef {boolean} Result
 */

/**
 * Creates an eth_submitWork JSON-RPC request
 *
 * @param {Data} nonce - 8 bytes - The nonce found
 * @param {Data} powHash - 32 bytes - The header's pow-hash
 * @param {Data} mixDigest - 32 bytes - The mix digest
 * @returns {RequestArguments}
 */
export function SubmitWorkRequest(nonce, powHash, mixDigest) {
	return {
		method,
		params: [nonce, powHash, mixDigest],
	};
}
