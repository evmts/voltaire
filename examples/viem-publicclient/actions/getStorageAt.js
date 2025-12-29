/**
 * getStorageAt Action
 *
 * Returns the value from a storage position at an address.
 *
 * @module examples/viem-publicclient/actions/getStorageAt
 */

import { numberToHex, normalizeAddress } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetStorageAtParameters} GetStorageAtParameters
 */

/**
 * Get storage at a slot
 *
 * @param {Client} client - Client instance
 * @param {GetStorageAtParameters} params - Parameters
 * @returns {Promise<string | undefined>} Storage value or undefined
 *
 * @example
 * ```typescript
 * const value = await getStorageAt(client, {
 *   address: '0x...',
 *   slot: '0x0'
 * });
 * ```
 */
export async function getStorageAt(client, { address, slot, blockNumber, blockTag = "latest" }) {
	const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : undefined;

	const value = await client.request({
		method: "eth_getStorageAt",
		params: [normalizeAddress(address), slot, blockNumberHex ?? blockTag],
	});

	if (value === "0x0000000000000000000000000000000000000000000000000000000000000000") {
		return undefined;
	}

	return /** @type {string} */ (value);
}
