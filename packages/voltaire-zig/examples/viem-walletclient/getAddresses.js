/**
 * Get Addresses
 *
 * Returns a list of account addresses owned by the wallet or client.
 *
 * @module getAddresses
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
 * Get addresses from wallet
 *
 * Returns addresses managed by the wallet. For local accounts, returns
 * the single hoisted address. For JSON-RPC accounts, calls eth_accounts.
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @returns {Promise<string[]>}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { privateKeyToAccount } from '../viem-account/index.js';
 *
 * // Local account - returns hoisted address
 * const account = privateKeyToAccount('0x...');
 * const client = createWalletClient({ account, transport: http() });
 * const addresses = await client.getAddresses();
 * // ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']
 *
 * // JSON-RPC - calls eth_accounts
 * const client2 = createWalletClient({ transport: custom(window.ethereum) });
 * const addresses2 = await client2.getAddresses();
 * // ['0x...', '0x...']
 * ```
 */
export async function getAddresses(client) {
	// Local account: return the hoisted address
	if (client.account?.type === "local") {
		return [client.account.address];
	}

	// JSON-RPC: call eth_accounts
	const addresses = await client.request(
		{ method: "eth_accounts" },
		{ dedupe: true },
	);

	// Return checksummed addresses
	return addresses.map((address) => checksumAddress(address));
}

/**
 * Factory: Create getAddresses with custom dependencies
 *
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @returns {(client: import('./WalletClientTypes.js').Client) => Promise<string[]>}
 */
export function GetAddresses({ keccak256: keccak256Fn }) {
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

	return async function getAddresses(client) {
		if (client.account?.type === "local") {
			return [client.account.address];
		}

		const addresses = await client.request(
			{ method: "eth_accounts" },
			{ dedupe: true },
		);

		return addresses.map((address) => checksumAddr(address));
	};
}

export default getAddresses;
