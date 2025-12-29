/**
 * call Action
 *
 * Executes a new message call immediately without creating a transaction.
 *
 * @module examples/viem-publicclient/actions/call
 */

import { numberToHex, normalizeAddress } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').CallParameters} CallParameters
 * @typedef {import('../PublicClientType.js').CallResult} CallResult
 */

/**
 * Execute a call without creating a transaction
 *
 * @param {Client} client - Client instance
 * @param {CallParameters} params - Call parameters
 * @returns {Promise<CallResult>} Call result
 *
 * @example
 * ```typescript
 * const result = await call(client, {
 *   to: '0x...',
 *   data: '0x...'
 * });
 * // => { data: '0x...' }
 * ```
 */
export async function call(client, params) {
	const {
		account,
		data,
		to,
		value,
		gas,
		gasPrice,
		maxFeePerGas,
		maxPriorityFeePerGas,
		blockNumber,
		blockTag = "latest",
	} = params;

	const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : undefined;

	/** @type {Record<string, string>} */
	const request = {};

	if (account) request.from = normalizeAddress(account);
	if (to) request.to = normalizeAddress(to);
	if (data) request.data = typeof data === "string" ? data : `0x${Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("")}`;
	if (typeof value === "bigint") request.value = numberToHex(value);
	if (typeof gas === "bigint") request.gas = numberToHex(gas);
	if (typeof gasPrice === "bigint") request.gasPrice = numberToHex(gasPrice);
	if (typeof maxFeePerGas === "bigint") request.maxFeePerGas = numberToHex(maxFeePerGas);
	if (typeof maxPriorityFeePerGas === "bigint") request.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas);

	const response = await client.request({
		method: "eth_call",
		params: [request, blockNumberHex ?? blockTag],
	});

	if (response === "0x") {
		return { data: undefined };
	}

	return { data: /** @type {string} */ (response) };
}
