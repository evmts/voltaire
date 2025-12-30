/**
 * getBlockNumber Action
 *
 * Returns the number of the most recent block.
 *
 * @module examples/viem-publicclient/actions/getBlockNumber
 */

import { withCache } from "../utils/cache.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetBlockNumberParameters} GetBlockNumberParameters
 */

/**
 * Get cache key for block number
 *
 * @param {string} id - Client UID
 * @returns {string} Cache key
 */
const cacheKey = (id) => `blockNumber.${id}`;

/**
 * Get the current block number
 *
 * @param {Client} client - Client instance
 * @param {GetBlockNumberParameters} [params] - Parameters
 * @returns {Promise<bigint>} Current block number
 *
 * @example
 * ```typescript
 * const blockNumber = await getBlockNumber(client);
 * // => 19123456n
 * ```
 */
export async function getBlockNumber(
	client,
	{ cacheTime = client.cacheTime } = {},
) {
	const blockNumberHex = await withCache(
		() =>
			client.request({
				method: "eth_blockNumber",
			}),
		{ cacheKey: cacheKey(client.uid), cacheTime },
	);
	return BigInt(/** @type {string} */ (blockNumberHex));
}
