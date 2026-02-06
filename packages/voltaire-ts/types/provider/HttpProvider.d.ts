/**
 * HTTP Provider
 *
 * EIP-1193 compliant JSON-RPC provider using HTTP transport with fetch API.
 * Supports configurable timeout and retries.
 *
 * @module provider/HttpProvider
 */
import type { Provider } from "./Provider.js";
import type { ProviderEvent, ProviderEventMap, RequestArguments } from "./types.js";
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
export declare class HttpProvider implements Provider {
    private url;
    private headers;
    private defaultTimeout;
    private defaultRetry;
    private defaultRetryDelay;
    private requestIdCounter;
    private eventListeners;
    constructor(options: HttpProviderOptions | string);
    /**
     * Execute single fetch attempt with timeout
     */
    private executeRequest;
    /**
     * Handle request error and determine if retry is needed
     * Returns true if should retry, throws if error is final
     */
    private handleRequestError;
    /**
     * EIP-1193 request method
     * Submits JSON-RPC request and returns result or throws RpcError
     */
    request(args: RequestArguments): Promise<unknown>;
    /**
     * Register event listener
     */
    on<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Remove event listener
     */
    removeListener<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
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
    protected emit<E extends ProviderEvent>(event: E, ...args: ProviderEventMap[E]): void;
}
//# sourceMappingURL=HttpProvider.d.ts.map