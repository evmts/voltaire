/**
 * getTransactionCount Action
 *
 * Returns the number of transactions sent from an address (nonce).
 *
 * @module examples/viem-publicclient/actions/getTransactionCount
 */

import {
	hexToNumber,
	normalizeAddress,
	numberToHex,
} from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetTransactionCountParameters} GetTransactionCountParameters
 */

/**
 * Get transaction count (nonce)
 *
 * @param {Client} client - Client instance
 * @param {GetTransactionCountParameters} params - Parameters
 * @returns {Promise<number>} Transaction count
 *
 * @example
 * ```typescript
 * const nonce = await getTransactionCount(client, {
 *   address: '0x...'
 * });
 * ```
 */
export async function getTransactionCount(
	client,
	{ address, blockNumber, blockTag = "latest" },
) {
	const blockNumberHex =
		typeof blockNumber === "bigint" ? numberToHex(blockNumber) : undefined;

	const count = await client.request({
		method: "eth_getTransactionCount",
		params: [normalizeAddress(address), blockNumberHex ?? blockTag],
	});

	return hexToNumber(/** @type {string} */ (count));
}
