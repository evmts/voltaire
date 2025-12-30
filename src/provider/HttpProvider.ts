/**
 * HTTP Provider
 *
 * EIP-1193 compliant JSON-RPC provider using HTTP transport with fetch API.
 * Supports configurable timeout and retries.
 *
 * @module provider/HttpProvider
 */

import type { Provider } from "./Provider.js";
import type {
	ProviderEvent,
	ProviderEventListener,
	ProviderEventMap,
	RequestArguments,
	RpcError,
} from "./types.js";

/**
 * JSON-RPC response structure
 */
interface JsonRpcResponse {
	jsonrpc: string;
	id: number;
	result?: unknown;
	error?: RpcError;
}

/**
 * HTTP configuration options
 */
export interface HttpProviderOptions {
	/** JSON-RPC endpoint URL */
	url: string;
	/** Optional HTTP headers */
	headers?: Record<string, string>;
	/** Default request timeout in ms */
	timeout?: number;
	/** Default retry attempts */
	retry?: number;
	/** Default retry delay in ms */
	retryDelay?: number;
}

/**
 * HTTP Provider implementation
 *
 * EIP-1193 compliant provider using HTTP transport via fetch API.
 * Throws RpcError on failures.
 *
 * @example
 * ```typescript
 * const provider = new HttpProvider({
 *   url: 'https://eth.example.com',
 *   timeout: 30000
 * });
 *
 * const blockNumber = await provider.request({
 *   method: 'eth_blockNumber',
 *   params: []
 * });
 * ```
 */
export class HttpProvider implements Provider {
	private url: string;
	private headers: Record<string, string>;
	private defaultTimeout: number;
	private defaultRetry: number;
	private defaultRetryDelay: number;
	private requestIdCounter = 0;
	private eventListeners: Map<ProviderEvent, Set<ProviderEventListener>> =
		new Map();

	constructor(options: HttpProviderOptions | string) {
		if (typeof options === "string") {
			this.url = options;
			this.headers = { "Content-Type": "application/json" };
			this.defaultTimeout = 30000;
			this.defaultRetry = 3;
			this.defaultRetryDelay = 1000;
		} else {
			this.url = options.url;
			this.headers = {
				"Content-Type": "application/json",
				...options.headers,
			};
			this.defaultTimeout = options.timeout ?? 30000;
			this.defaultRetry = options.retry ?? 3;
			this.defaultRetryDelay = options.retryDelay ?? 1000;
		}
	}

	/**
	 * Execute single fetch attempt with timeout
	 */
	private async executeRequest(
		body: string,
		timeout: number,
	): Promise<unknown> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(this.url, {
				method: "POST",
				headers: this.headers,
				body,
				signal: controller.signal,
			});

			if (!response.ok) {
				const error: RpcError = {
					code: -32603,
					message: `HTTP ${response.status}: ${response.statusText}`,
				};
				throw error;
			}

			const json = (await response.json()) as JsonRpcResponse;
			if (json.error) {
				throw json.error;
			}
			return json.result;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Handle request error and determine if retry is needed
	 * Returns true if should retry, throws if error is final
	 */
	private handleRequestError(error: Error, timeout: number): boolean {
		if (error.name === "AbortError") {
			const timeoutError: RpcError = {
				code: -32603,
				message: `Request timeout after ${timeout}ms`,
			};
			throw timeoutError;
		}
		if ("code" in error && "message" in error) {
			throw error;
		}
		return true;
	}

	/**
	 * EIP-1193 request method
	 * Submits JSON-RPC request and returns result or throws RpcError
	 */
	async request(args: RequestArguments): Promise<unknown> {
		const { method, params = [] } = args;
		const body = JSON.stringify({
			jsonrpc: "2.0",
			id: ++this.requestIdCounter,
			method,
			params: Array.isArray(params) ? params : [params],
		});

		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= this.defaultRetry; attempt++) {
			try {
				return await this.executeRequest(body, this.defaultTimeout);
			} catch (error) {
				lastError = error as Error;
				const shouldRetry = this.handleRequestError(
					lastError,
					this.defaultTimeout,
				);
				if (shouldRetry && attempt < this.defaultRetry) {
					await new Promise((resolve) =>
						setTimeout(resolve, this.defaultRetryDelay),
					);
				}
			}
		}

		const networkError: RpcError = {
			code: -32603,
			message: lastError?.message ?? "Request failed",
		};
		throw networkError;
	}

	/**
	 * Register event listener
	 */
	on<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(listener as ProviderEventListener);
		return this;
	}

	/**
	 * Remove event listener
	 */
	removeListener<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		this.eventListeners.get(event)?.delete(listener as ProviderEventListener);
		return this;
	}

	/**
	 * Emit event to all listeners (internal use)
	 *
	 * NOTE: HttpProvider does not emit events as HTTP is stateless.
	 * Events like connect/disconnect/chainChanged are only relevant for
	 * stateful transports like WebSocket. This method is provided for
	 * interface consistency but is not called by HttpProvider.
	 *
	 * For blockchain events (newHeads, logs, etc.), use WebSocketProvider
	 * or polling with eth_newBlockFilter/eth_getFilterChanges.
	 */
	protected emit<E extends ProviderEvent>(
		event: E,
		...args: ProviderEventMap[E]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				listener(...args);
			});
		}
	}
}
