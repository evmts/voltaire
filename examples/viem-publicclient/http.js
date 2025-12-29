/**
 * HTTP Transport
 *
 * HTTP transport for JSON-RPC communication.
 *
 * @module examples/viem-publicclient/http
 */

import { RpcRequestError, UrlRequiredError } from "./errors.js";
import { createTransport } from "./createTransport.js";

/**
 * @typedef {import('./PublicClientType.js').Chain} Chain
 * @typedef {import('./PublicClientType.js').TransportFactory} TransportFactory
 */

/**
 * HTTP transport configuration
 *
 * @typedef {object} HttpTransportConfig
 * @property {number} [retryCount] - Number of retries
 * @property {number} [retryDelay] - Delay between retries in ms
 * @property {number} [timeout] - Request timeout in ms
 * @property {RequestInit} [fetchOptions] - Fetch options
 */

let requestId = 0;

/**
 * Create HTTP transport
 *
 * @param {string} [url] - RPC URL (falls back to chain default)
 * @param {HttpTransportConfig} [config] - Transport configuration
 * @returns {TransportFactory} Transport factory
 */
export function http(url, config = {}) {
	const {
		retryCount,
		retryDelay,
		timeout = 10_000,
		fetchOptions,
	} = config;

	return ({ chain, pollingInterval }) => {
		const rpcUrl = url ?? chain?.rpcUrls.default.http[0];
		if (!rpcUrl) {
			throw new UrlRequiredError();
		}

		/**
		 * @param {{ method: string; params?: unknown[] }} args
		 * @returns {Promise<unknown>}
		 */
		async function request({ method, params }) {
			const body = {
				jsonrpc: "2.0",
				id: ++requestId,
				method,
				params: params ?? [],
			};

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				const response = await fetch(rpcUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...fetchOptions?.headers,
					},
					body: JSON.stringify(body),
					signal: controller.signal,
					...fetchOptions,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new RpcRequestError({
						body,
						error: {
							code: -32603,
							message: `HTTP ${response.status}: ${response.statusText}`,
						},
						url: rpcUrl,
					});
				}

				const json = await response.json();

				if (json.error) {
					throw new RpcRequestError({
						body,
						error: json.error,
						url: rpcUrl,
					});
				}

				return json.result;
			} catch (error) {
				clearTimeout(timeoutId);

				if (error instanceof RpcRequestError) {
					throw error;
				}

				if (error?.name === "AbortError") {
					throw new RpcRequestError({
						body,
						error: {
							code: -32603,
							message: `Request timeout after ${timeout}ms`,
						},
						url: rpcUrl,
					});
				}

				throw new RpcRequestError({
					body,
					error: {
						code: -32603,
						message: error?.message ?? "Request failed",
					},
					url: rpcUrl,
				});
			}
		}

		return createTransport(
			{
				key: "http",
				name: "HTTP JSON-RPC",
				request,
				retryCount,
				retryDelay,
				timeout,
				type: "http",
			},
			{
				url: rpcUrl,
				fetchOptions,
			},
		);
	};
}
