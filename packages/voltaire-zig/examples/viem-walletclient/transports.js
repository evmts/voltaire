/**
 * Transport Utilities
 *
 * Creates transport functions for WalletClient.
 *
 * @module transports
 */

/**
 * Generate a unique request ID
 *
 * @returns {number}
 */
let requestId = 0;
function getRequestId() {
	return ++requestId;
}

/**
 * Create an HTTP transport
 *
 * @param {string} url - JSON-RPC endpoint URL
 * @param {Object} [options]
 * @param {number} [options.timeout] - Request timeout in ms
 * @param {number} [options.retryCount] - Number of retries
 * @param {number} [options.retryDelay] - Delay between retries in ms
 * @param {Object} [options.fetchOptions] - Additional fetch options
 * @returns {import('./WalletClientTypes.js').Transport}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { http } from './transports.js';
 *
 * const client = createWalletClient({
 *   transport: http('https://mainnet.infura.io/v3/YOUR_KEY'),
 * });
 * ```
 */
export function http(url, options = {}) {
	const {
		timeout = 10_000,
		retryCount = 3,
		retryDelay = 150,
		fetchOptions = {},
	} = options;

	return function httpTransport({ chain, pollingInterval }) {
		const resolvedUrl = url || chain?.rpcUrls?.default?.http?.[0];

		if (!resolvedUrl) {
			throw new Error("No URL provided and no default RPC URL found on chain");
		}

		/**
		 * Make JSON-RPC request
		 *
		 * @param {Object} params
		 * @param {string} params.method
		 * @param {unknown[]} [params.params]
		 * @param {Object} [requestOptions]
		 * @returns {Promise<unknown>}
		 */
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: viem compatibility
		async function request({ method, params = [] }, requestOptions = {}) {
			const body = JSON.stringify({
				jsonrpc: "2.0",
				id: getRequestId(),
				method,
				params,
			});

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			let lastError;
			const maxRetries = requestOptions.retryCount ?? retryCount;

			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					const response = await fetch(resolvedUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body,
						signal: controller.signal,
						...fetchOptions,
					});

					clearTimeout(timeoutId);

					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`);
					}

					const json = await response.json();

					if (json.error) {
						const error = new Error(json.error.message || "RPC Error");
						error.code = json.error.code;
						error.data = json.error.data;
						throw error;
					}

					return json.result;
				} catch (err) {
					lastError = err;
					if (attempt < maxRetries) {
						await new Promise((resolve) =>
							setTimeout(resolve, retryDelay * (attempt + 1)),
						);
					}
				}
			}

			clearTimeout(timeoutId);
			throw lastError;
		}

		return {
			config: {
				key: "http",
				name: "HTTP JSON-RPC",
				type: "http",
				retryCount,
				retryDelay,
				timeout,
			},
			request,
			value: {
				url: resolvedUrl,
			},
		};
	};
}

/**
 * Create a custom transport from an EIP-1193 provider
 *
 * @param {Object} provider - EIP-1193 provider (e.g., window.ethereum)
 * @param {Object} [options]
 * @param {number} [options.retryCount] - Number of retries
 * @param {number} [options.retryDelay] - Delay between retries in ms
 * @returns {import('./WalletClientTypes.js').Transport}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { custom } from './transports.js';
 *
 * // Browser: use injected wallet
 * const client = createWalletClient({
 *   transport: custom(window.ethereum),
 * });
 *
 * // Or any EIP-1193 compatible provider
 * const client2 = createWalletClient({
 *   transport: custom(myProvider),
 * });
 * ```
 */
export function custom(provider, options = {}) {
	const { retryCount = 0, retryDelay = 150 } = options;

	return function customTransport({ chain, pollingInterval }) {
		/**
		 * Make request to provider
		 *
		 * @param {Object} params
		 * @param {string} params.method
		 * @param {unknown[]} [params.params]
		 * @param {Object} [requestOptions]
		 * @returns {Promise<unknown>}
		 */
		async function request({ method, params = [] }, requestOptions = {}) {
			let lastError;
			const maxRetries = requestOptions.retryCount ?? retryCount;

			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					// EIP-1193 request
					const result = await provider.request({ method, params });
					return result;
				} catch (err) {
					lastError = err;
					if (attempt < maxRetries) {
						await new Promise((resolve) =>
							setTimeout(resolve, retryDelay * (attempt + 1)),
						);
					}
				}
			}

			throw lastError;
		}

		return {
			config: {
				key: "custom",
				name: "Custom Provider",
				type: "custom",
				retryCount,
				retryDelay,
			},
			request,
			value: {
				provider,
			},
		};
	};
}

/**
 * Create a fallback transport that tries multiple transports in order
 *
 * @param {import('./WalletClientTypes.js').Transport[]} transports
 * @param {Object} [options]
 * @param {number} [options.retryCount]
 * @returns {import('./WalletClientTypes.js').Transport}
 *
 * @example
 * ```javascript
 * import { createWalletClient } from './createWalletClient.js';
 * import { http, fallback } from './transports.js';
 *
 * const client = createWalletClient({
 *   transport: fallback([
 *     http('https://mainnet.infura.io/v3/...'),
 *     http('https://eth-mainnet.alchemyapi.io/v2/...'),
 *     http('https://cloudflare-eth.com'),
 *   ]),
 * });
 * ```
 */
export function fallback(transports, options = {}) {
	const { retryCount = 3 } = options;

	return function fallbackTransport({ chain, pollingInterval }) {
		// Initialize all transports
		const initializedTransports = transports.map((t) =>
			t({ chain, pollingInterval }),
		);

		/**
		 * Make request, falling back through transports on failure
		 */
		async function request({ method, params = [] }, requestOptions = {}) {
			let lastError;

			for (const transport of initializedTransports) {
				try {
					return await transport.request({ method, params }, requestOptions);
				} catch (err) {
					lastError = err;
				}
			}

			throw lastError;
		}

		return {
			config: {
				key: "fallback",
				name: "Fallback",
				type: "fallback",
				retryCount,
			},
			request,
			value: {
				transports: initializedTransports,
			},
		};
	};
}

export default { http, custom, fallback };
