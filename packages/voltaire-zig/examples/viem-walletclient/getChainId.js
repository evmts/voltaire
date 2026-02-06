/**
 * Get Chain ID
 *
 * Returns the chain ID of the connected network.
 *
 * @module getChainId
 */

/**
 * Get the chain ID from the connected network
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @returns {Promise<number>}
 *
 * @example
 * ```javascript
 * import { createWalletClient, http } from './index.js';
 *
 * const client = createWalletClient({
 *   transport: http('https://mainnet.infura.io/v3/...'),
 * });
 *
 * const chainId = await client.getChainId();
 * console.log('Chain ID:', chainId); // 1
 * ```
 */
export async function getChainId(client) {
	// Call eth_chainId
	const chainIdHex = await client.request({ method: "eth_chainId" });

	// Convert hex to number
	return Number.parseInt(chainIdHex, 16);
}

/**
 * Factory: Create getChainId (no dependencies needed)
 *
 * @returns {(client: import('./WalletClientTypes.js').Client) => Promise<number>}
 */
export function GetChainId() {
	return async function getChainId(client) {
		const chainIdHex = await client.request({ method: "eth_chainId" });
		return Number.parseInt(chainIdHex, 16);
	};
}

export default getChainId;
