/**
 * Transport Factory
 *
 * Creates transport configuration for client.
 *
 * @module examples/viem-publicclient/createTransport
 */

import { uid } from "./utils/uid.js";

/**
 * @typedef {import('./PublicClientType.js').TransportConfig} TransportConfig
 * @typedef {import('./PublicClientType.js').Transport} Transport
 * @typedef {import('./PublicClientType.js').RequestFn} RequestFn
 */

/**
 * Wrap request function with retry logic
 *
 * @param {RequestFn} request - Base request function
 * @param {{ retryCount: number; retryDelay: number }} options - Retry options
 * @returns {RequestFn} Wrapped request function
 */
function buildRequest(request, { retryCount, retryDelay }) {
	return async (args) => {
		let lastError;
		for (let attempt = 0; attempt <= retryCount; attempt++) {
			try {
				return await request(args);
			} catch (error) {
				lastError = error;
				// Don't retry on RPC errors (they won't succeed on retry)
				if (error && typeof error === "object" && "code" in error) {
					throw error;
				}
				if (attempt < retryCount) {
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}
		throw lastError;
	};
}

/**
 * Create transport configuration
 *
 * @param {{
 *   key: string;
 *   name: string;
 *   request: RequestFn;
 *   retryCount?: number;
 *   retryDelay?: number;
 *   timeout?: number;
 *   type: string;
 * }} config - Transport configuration
 * @param {Record<string, unknown>} [value] - Transport-specific values
 * @returns {Transport} Transport object
 */
export function createTransport(
	{
		key,
		name,
		request,
		retryCount = 3,
		retryDelay = 150,
		timeout,
		type,
	},
	value,
) {
	const transportUid = uid();

	return {
		config: {
			key,
			name,
			request,
			retryCount,
			retryDelay,
			timeout,
			type,
		},
		request: buildRequest(request, { retryCount, retryDelay }),
		value,
	};
}
