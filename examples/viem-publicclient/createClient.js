/**
 * Base Client Factory
 *
 * Creates a base client with transport and extend pattern.
 *
 * @module examples/viem-publicclient/createClient
 */

import { uid } from "./utils/uid.js";

/**
 * @typedef {import('./PublicClientType.js').ClientConfig} ClientConfig
 * @typedef {import('./PublicClientType.js').Client} Client
 */

/**
 * Create a base client
 *
 * @param {ClientConfig} parameters - Client configuration
 * @returns {Client} Base client
 */
export function createClient(parameters) {
	const {
		batch,
		chain,
		key = "base",
		name = "Base Client",
	} = parameters;

	// Calculate polling interval from chain block time
	const blockTime = chain?.blockTime ?? 12_000;
	const defaultPollingInterval = Math.min(Math.max(Math.floor(blockTime / 2), 500), 4_000);
	const pollingInterval = parameters.pollingInterval ?? defaultPollingInterval;
	const cacheTime = parameters.cacheTime ?? pollingInterval;

	// Create transport
	const { config, request, value } = parameters.transport({
		chain,
		pollingInterval,
	});

	const transport = { ...config, ...value };

	/** @type {Client} */
	const client = {
		batch,
		cacheTime,
		chain,
		key,
		name,
		pollingInterval,
		request,
		transport,
		type: "base",
		uid: uid(),
		extend: /** @type {Client['extend']} */ (function () {}), // Placeholder, replaced below
	};

	/**
	 * Create extend function for composable client extension
	 *
	 * @template {Record<string, unknown>} TExtension
	 * @param {Client} base - Base client to extend
	 * @returns {(fn: (client: Client) => TExtension) => Client & TExtension}
	 */
	function extend(base) {
		return (extendFn) => {
			const extended = extendFn(base);
			// Remove base client properties from extension (prevent override)
			for (const k in client) {
				delete extended[k];
			}
			const combined = { ...base, ...extended };
			return Object.assign(combined, { extend: extend(combined) });
		};
	}

	return Object.assign(client, { extend: extend(client) });
}
