/**
 * estimateGas Action
 *
 * Estimates the gas necessary to complete a transaction.
 *
 * @module examples/viem-publicclient/actions/estimateGas
 */

import { normalizeAddress, numberToHex } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').EstimateGasParameters} EstimateGasParameters
 */

/**
 * Estimate gas for a transaction
 *
 * @param {Client} client - Client instance
 * @param {EstimateGasParameters} params - Parameters
 * @returns {Promise<bigint>} Gas estimate
 *
 * @example
 * ```typescript
 * const gas = await estimateGas(client, {
 *   to: '0x...',
 *   value: 1000000000000000000n
 * });
 * // => 21000n
 * ```
 */
export async function estimateGas(client, params) {
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

	const blockNumberHex =
		typeof blockNumber === "bigint" ? numberToHex(blockNumber) : undefined;

	/** @type {Record<string, string>} */
	const request = {};

	if (account) request.from = normalizeAddress(account);
	if (to) request.to = normalizeAddress(to);
	if (data)
		request.data =
			typeof data === "string"
				? data
				: `0x${Array.from(data)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("")}`;
	if (typeof value === "bigint") request.value = numberToHex(value);
	if (typeof gas === "bigint") request.gas = numberToHex(gas);
	if (typeof gasPrice === "bigint") request.gasPrice = numberToHex(gasPrice);
	if (typeof maxFeePerGas === "bigint")
		request.maxFeePerGas = numberToHex(maxFeePerGas);
	if (typeof maxPriorityFeePerGas === "bigint")
		request.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas);

	const params_ = blockNumberHex ? [request, blockNumberHex] : [request];

	const gasEstimate = await client.request({
		method: "eth_estimateGas",
		params: params_,
	});

	return BigInt(/** @type {string} */ (gasEstimate));
}
