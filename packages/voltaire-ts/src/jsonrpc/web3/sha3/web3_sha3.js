/**
 * @fileoverview web3_sha3 JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Data} Data
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns Keccak-256 (not the standardized SHA3-256) of the given data.
 *
 * @example
 * Params: ["0x68656c6c6f20776f726c64"]
 * Result: "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"
 *
 * Implements the `web3_sha3` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "web3_sha3";

/**
 * Result for `web3_sha3`
 *
 * @typedef {Data} Result
 */

/**
 * Creates a web3_sha3 JSON-RPC request
 *
 * @param {Data} data - The data to hash
 * @returns {RequestArguments}
 */
export function Sha3Request(data) {
	return {
		method,
		params: [data],
	};
}
