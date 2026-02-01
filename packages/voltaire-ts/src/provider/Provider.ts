/**
 * Provider Interface
 *
 * EIP-1193 compliant Ethereum provider interface.
 * Provides single request() method and EventEmitter capabilities.
 *
 * @module provider/Provider
 */

import type {
	ProviderEvent,
	ProviderEventMap,
	RequestArguments,
} from "./types.js";

/**
 * EIP-1193 Provider interface for Ethereum JSON-RPC communication
 *
 * Compliant with EIP-1193 specification:
 * - Single request() method for all RPC calls
 * - EventEmitter for blockchain events (accountsChanged, chainChanged, etc.)
 * - Throws RpcError on failures (does not return error objects)
 *
 * @example
 * ```typescript
 * const provider: Provider = new HttpProvider('https://eth.example.com');
 *
 * // Make requests
 * const blockNumber = await provider.request({
 *   method: 'eth_blockNumber',
 *   params: []
 * });
 *
 * // Listen to events
 * provider.on('chainChanged', (chainId) => {
 *   console.log('Chain changed:', chainId);
 * });
 * ```
 */
export interface Provider {
	/**
	 * Submit JSON-RPC request to provider
	 *
	 * @param args - Request arguments containing method and params
	 * @returns Promise resolving to the result
	 * @throws RpcError on failure
	 */
	request(args: RequestArguments): Promise<unknown>;

	/**
	 * Register event listener
	 *
	 * @param event - Event name
	 * @param listener - Event listener callback
	 * @returns Provider instance for chaining
	 */
	on<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this;

	/**
	 * Remove event listener
	 *
	 * @param event - Event name
	 * @param listener - Event listener callback to remove
	 * @returns Provider instance for chaining
	 */
	removeListener<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this;
}
