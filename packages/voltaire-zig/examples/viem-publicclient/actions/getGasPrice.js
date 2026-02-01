/**
 * getGasPrice Action
 *
 * Returns the current gas price.
 *
 * @module examples/viem-publicclient/actions/getGasPrice
 */

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 */

/**
 * Get current gas price
 *
 * @param {Client} client - Client instance
 * @returns {Promise<bigint>} Gas price in wei
 *
 * @example
 * ```typescript
 * const gasPrice = await getGasPrice(client);
 * // => 20000000000n (20 gwei)
 * ```
 */
export async function getGasPrice(client) {
	const gasPrice = await client.request({
		method: "eth_gasPrice",
	});

	return BigInt(/** @type {string} */ (gasPrice));
}
