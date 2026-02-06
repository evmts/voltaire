/**
 * BatchedProvider - JSON-RPC batch request provider
 *
 * Wraps any EIP-1193 provider or HTTP endpoint to batch multiple RPC calls
 * into a single HTTP request. Improves performance by reducing round-trips.
 *
 * @module batched-provider/BatchedProvider
 */

import { createBatchScheduler } from "./BatchScheduler.js";

/**
 * @typedef {import('./BatchedProviderTypes.js').BatchedProviderOptions} BatchedProviderOptions
 * @typedef {import('./BatchedProviderTypes.js').RequestArguments} RequestArguments
 * @typedef {import('./BatchedProviderTypes.js').JsonRpcRequest} JsonRpcRequest
 * @typedef {import('./BatchedProviderTypes.js').JsonRpcResponse} JsonRpcResponse
 * @typedef {import('./BatchedProviderTypes.js').EIP1193Provider} EIP1193Provider
 */

/**
 * Create a batched provider that wraps an HTTP endpoint
 *
 * @param {string | BatchedProviderOptions} urlOrOptions - URL string or full options
 * @returns {import('./BatchedProviderTypes.js').BatchedProvider} Batched provider instance
 *
 * @example
 * ```javascript
 * // Simple usage with URL
 * const provider = createBatchedProvider('https://eth.llamarpc.com');
 *
 * // Multiple concurrent requests are batched automatically
 * const [blockNumber, balance, code] = await Promise.all([
 *   provider.request({ method: 'eth_blockNumber', params: [] }),
 *   provider.request({ method: 'eth_getBalance', params: ['0x...', 'latest'] }),
 *   provider.request({ method: 'eth_getCode', params: ['0x...', 'latest'] })
 * ]);
 *
 * // Force flush pending requests
 * await provider.flush();
 * ```
 *
 * @example
 * ```javascript
 * // With configuration
 * const provider = createBatchedProvider({
 *   http: { url: 'https://eth.llamarpc.com' },
 *   wait: 20,        // 20ms debounce window
 *   maxBatchSize: 50 // Max 50 requests per batch
 * });
 * ```
 */
export function createBatchedProvider(urlOrOptions) {
	/** @type {BatchedProviderOptions} */
	const options =
		typeof urlOrOptions === "string"
			? { http: { url: urlOrOptions } }
			: urlOrOptions;

	const {
		wait = 10,
		maxBatchSize = 100,
		timeout = 30000,
		http,
		provider: underlyingProvider,
	} = options;

	// Validate configuration
	if (!http && !underlyingProvider) {
		throw new Error("Either http.url or provider must be specified");
	}

	let destroyed = false;

	/**
	 * Execute batch via HTTP
	 * @param {Array<JsonRpcRequest>} requests
	 * @returns {Promise<Array<JsonRpcResponse>>}
	 */
	async function executeHttpBatch(requests) {
		if (!http) throw new Error("HTTP transport not configured");

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const fetchFn = http.fetchFn ?? fetch;
			const response = await fetchFn(http.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...http.headers,
				},
				body: JSON.stringify(requests),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const body = await response.text().catch(() => "");
				const error = new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
				/** @type {any} */ (error).status = response.status;
				/** @type {any} */ (error).statusText = response.statusText;
				/** @type {any} */ (error).body = body;
				throw error;
			}

			const data = await response.json();

			// Ensure response is an array
			return Array.isArray(data) ? data : [data];
		} catch (error) {
			clearTimeout(timeoutId);

			// Convert abort to timeout error
			if (/** @type {any} */ (error).name === "AbortError") {
				const timeoutError = new Error(
					`Batch request timed out after ${timeout}ms`,
				);
				/** @type {any} */ (timeoutError).name = "BatchTimeoutError";
				/** @type {any} */ (timeoutError).timeout = timeout;
				throw timeoutError;
			}

			throw error;
		}
	}

	/**
	 * Execute batch via underlying EIP-1193 provider (parallel requests)
	 * @param {Array<JsonRpcRequest>} requests
	 * @returns {Promise<Array<JsonRpcResponse>>}
	 */
	async function executeProviderBatch(requests) {
		if (!underlyingProvider) throw new Error("Provider not configured");

		// Execute all requests in parallel
		const results = await Promise.allSettled(
			requests.map((req) =>
				underlyingProvider.request({
					method: req.method,
					params: req.params,
				}),
			),
		);

		// Convert to JSON-RPC response format
		return results.map((result, index) => {
			const id = requests[index].id;

			if (result.status === "fulfilled") {
				return /** @type {JsonRpcResponse} */ ({
					jsonrpc: "2.0",
					id,
					result: result.value,
				});
			}
			const error = result.reason;
			return /** @type {JsonRpcResponse} */ ({
				jsonrpc: "2.0",
				id,
				error: {
					code: error?.code ?? -32603,
					message: error?.message ?? "Unknown error",
					data: error?.data,
				},
			});
		});
	}

	// Choose execution function based on transport
	const execute = http ? executeHttpBatch : executeProviderBatch;

	// Create scheduler
	const scheduler = createBatchScheduler({
		wait,
		maxBatchSize,
		execute,
	});

	/**
	 * EIP-1193 request method
	 * @param {RequestArguments} args
	 * @returns {Promise<unknown>}
	 */
	async function request(args) {
		if (destroyed) {
			throw new Error("Provider has been destroyed");
		}

		return scheduler.schedule(args);
	}

	/**
	 * Force flush pending batch
	 * @returns {Promise<void>}
	 */
	async function flush() {
		return scheduler.flush();
	}

	/**
	 * Get pending request count
	 * @returns {number}
	 */
	function getPendingCount() {
		return scheduler.getPendingCount();
	}

	/**
	 * Destroy provider
	 */
	function destroy() {
		destroyed = true;
		// Flush will reject any pending requests since destroyed=true
		scheduler.flush();
	}

	return {
		request,
		flush,
		getPendingCount,
		destroy,
	};
}

/**
 * Wrap an existing EIP-1193 provider with batching
 *
 * Note: This doesn't provide true HTTP batching - it only groups concurrent
 * requests for parallel execution. For true batching, use HTTP transport.
 *
 * @param {EIP1193Provider} provider - EIP-1193 provider to wrap
 * @param {Omit<BatchedProviderOptions, 'http' | 'provider'>} [options] - Batch options
 * @returns {import('./BatchedProviderTypes.js').BatchedProvider}
 *
 * @example
 * ```javascript
 * const batched = wrapProvider(window.ethereum, { wait: 10 });
 * ```
 */
export function wrapProvider(provider, options = {}) {
	return createBatchedProvider({
		...options,
		provider,
	});
}
