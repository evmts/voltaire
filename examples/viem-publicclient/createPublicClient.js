/**
 * PublicClient Factory
 *
 * Creates a PublicClient with public actions.
 *
 * @module examples/viem-publicclient/createPublicClient
 */

import { createClient } from "./createClient.js";
import { publicActions } from "./publicActions.js";

/**
 * @typedef {import('./PublicClientType.js').PublicClientConfig} PublicClientConfig
 * @typedef {import('./PublicClientType.js').PublicClient} PublicClient
 */

/**
 * Create a PublicClient
 *
 * A PublicClient provides access to public JSON-RPC methods like
 * fetching blocks, transactions, balances, and making calls.
 *
 * @param {PublicClientConfig} parameters - Client configuration
 * @returns {PublicClient} Public client with actions
 *
 * @example
 * ```typescript
 * import { createPublicClient, http } from './index.js';
 *
 * const client = createPublicClient({
 *   chain: mainnet,
 *   transport: http('https://eth.example.com')
 * });
 *
 * const blockNumber = await client.getBlockNumber();
 * ```
 */
export function createPublicClient(parameters) {
	const { key = "public", name = "Public Client" } = parameters;

	const client = createClient({
		...parameters,
		key,
		name,
	});

	// Set type to publicClient
	client.type = "publicClient";

	return /** @type {PublicClient} */ (client.extend(publicActions));
}
