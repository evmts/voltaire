/**
 * getChainId Action
 *
 * Returns the chain ID of the network.
 *
 * @module examples/viem-publicclient/actions/getChainId
 */

import { hexToNumber } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 */

/**
 * Get the chain ID
 *
 * @param {Client} client - Client instance
 * @returns {Promise<number>} Chain ID
 *
 * @example
 * ```typescript
 * const chainId = await getChainId(client);
 * // => 1 (mainnet)
 * ```
 */
export async function getChainId(client) {
	const chainIdHex = await client.request({
		method: "eth_chainId",
	});

	return hexToNumber(/** @type {string} */ (chainIdHex));
}
