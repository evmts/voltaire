/**
 * getBalance Action
 *
 * Returns the balance of an address in wei.
 *
 * @module examples/viem-publicclient/actions/getBalance
 */

import { normalizeAddress, numberToHex } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetBalanceParameters} GetBalanceParameters
 */

/**
 * Get the balance of an address
 *
 * @param {Client} client - Client instance
 * @param {GetBalanceParameters} params - Parameters
 * @returns {Promise<bigint>} Balance in wei
 *
 * @example
 * ```typescript
 * const balance = await getBalance(client, {
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
 * });
 * // => 1000000000000000000n (1 ETH)
 * ```
 */
export async function getBalance(
	client,
	{ address, blockNumber, blockTag = "latest" },
) {
	const blockNumberHex =
		typeof blockNumber === "bigint" ? numberToHex(blockNumber) : undefined;

	const balance = await client.request({
		method: "eth_getBalance",
		params: [normalizeAddress(address), blockNumberHex ?? blockTag],
	});

	return BigInt(/** @type {string} */ (balance));
}
