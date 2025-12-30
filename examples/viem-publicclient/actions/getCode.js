/**
 * getCode Action
 *
 * Returns the bytecode of a contract.
 *
 * @module examples/viem-publicclient/actions/getCode
 */

import { normalizeAddress, numberToHex } from "../utils/encoding.js";

/**
 * @typedef {import('../PublicClientType.js').Client} Client
 * @typedef {import('../PublicClientType.js').GetCodeParameters} GetCodeParameters
 */

/**
 * Get contract bytecode
 *
 * @param {Client} client - Client instance
 * @param {GetCodeParameters} params - Parameters
 * @returns {Promise<string | undefined>} Contract bytecode or undefined if no code
 *
 * @example
 * ```typescript
 * const code = await getCode(client, {
 *   address: '0x...'
 * });
 * ```
 */
export async function getCode(
	client,
	{ address, blockNumber, blockTag = "latest" },
) {
	const blockNumberHex =
		typeof blockNumber === "bigint" ? numberToHex(blockNumber) : undefined;

	const code = await client.request({
		method: "eth_getCode",
		params: [normalizeAddress(address), blockNumberHex ?? blockTag],
	});

	if (code === "0x") {
		return undefined;
	}

	return /** @type {string} */ (code);
}
