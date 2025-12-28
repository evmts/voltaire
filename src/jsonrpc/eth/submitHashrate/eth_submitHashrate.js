/**
 * @fileoverview eth_submitHashrate JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Data} Data
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Used for submitting mining hashrate.
 *
 * @example
 * Params: ["0x0000000000000000000000000000000000000000000000000000000000500000", "0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c"]
 * Result: true
 *
 * Implements the `eth_submitHashrate` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_submitHashrate";

/**
 * Result for `eth_submitHashrate`
 *
 * @typedef {boolean} Result
 */

/**
 * Creates an eth_submitHashrate JSON-RPC request
 *
 * @param {Quantity} hashrate - Hexadecimal string representation (32 bytes) of the hash rate
 * @param {Data} id - Random hexadecimal(32 bytes) ID identifying the client
 * @returns {RequestArguments}
 */
export function SubmitHashrateRequest(hashrate, id) {
	return {
		method,
		params: [hashrate, id],
	};
}
