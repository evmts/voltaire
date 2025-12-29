/**
 * Request Addresses
 *
 * Requests wallet connection and returns account addresses.
 * This triggers the wallet's permission request flow.
 *
 * @module requestAddresses
 */

import { hash as keccak256 } from "../../src/crypto/Keccak256/hash.js";

/**
 * Compute EIP-55 checksummed address
 *
 * @param {string} address
 * @returns {string}
 */
function checksumAddress(address) {
	const addr = address.toLowerCase().replace("0x", "");
	const hash = keccak256(new TextEncoder().encode(addr));
	let result = "0x";
	for (let i = 0; i < 40; i++) {
		const hashByte = hash[Math.floor(i / 2)];
		const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;
		result += hashNibble >= 8 ? addr[i].toUpperCase() : addr[i];
	}
	return result;
}

/**
 * Request addresses from wallet (EIP-1102)
 *
 * Sends a request to the wallet asking for permission to access
 * the user's accounts. After approval, returns the list of addresses.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @returns {Promise<string[]>}
 *
 * @example
 * ```javascript
 * import { createWalletClient, custom } from './index.js';
 *
 * const client = createWalletClient({
 *   transport: custom(window.ethereum),
 * });
 *
 * // This will trigger wallet popup asking for permission
 * const addresses = await client.requestAddresses();
 * console.log('Connected accounts:', addresses);
 * ```
 */
export async function requestAddresses(client) {
	// Call eth_requestAccounts (EIP-1102)
	const addresses = await client.request(
		{ method: "eth_requestAccounts" },
		{ dedupe: true, retryCount: 0 },
	);

	// Return checksummed addresses
	return addresses.map((address) => checksumAddress(address));
}

/**
 * Factory: Create requestAddresses with custom dependencies
 *
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(client: import('./WalletClientTypes.js').Client) => Promise<string[]>}
 */
export function RequestAddresses({ keccak256: keccak256Fn }) {
	function checksumAddr(address) {
		const addr = address.toLowerCase().replace("0x", "");
		const hash = keccak256Fn(new TextEncoder().encode(addr));
		let result = "0x";
		for (let i = 0; i < 40; i++) {
			const hashByte = hash[Math.floor(i / 2)];
			const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;
			result += hashNibble >= 8 ? addr[i].toUpperCase() : addr[i];
		}
		return result;
	}

	return async function requestAddresses(client) {
		const addresses = await client.request(
			{ method: "eth_requestAccounts" },
			{ dedupe: true, retryCount: 0 },
		);

		return addresses.map((address) => checksumAddr(address));
	};
}

export default requestAddresses;
