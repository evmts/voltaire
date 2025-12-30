/**
 * Typed Provider Interface
 *
 * Generic, strongly-typed EIP-1193 provider interface with RpcSchema support.
 *
 * @module provider/TypedProvider
 */

import type { RpcSchema } from "./RpcSchema.js";
import type { EIP1193EventMap } from "./events/EIP1193Events.js";
import type { EIP1193RequestFn } from "./request/EIP1193RequestFn.js";

/**
 * Generic Ethereum Provider interface
 *
 * @template TRpcSchema - RPC schema defining supported methods
 * @template TEventMap - Event map defining supported events (defaults to standard EIP-1193)
 *
 * @example
 * ```typescript
 * import type { TypedProvider, VoltaireRpcSchema, EIP1193EventMap } from './provider/index.js';
 *
 * // Provider with Voltaire's full JSON-RPC schema
 * type VoltaireProvider = TypedProvider<VoltaireRpcSchema, EIP1193EventMap>;
 *
 * // Provider with custom schema
 * type CustomProvider = TypedProvider<MyCustomSchema, MyEventMap>;
 * ```
 */
export interface TypedProvider<
	TRpcSchema extends RpcSchema = RpcSchema,
	// biome-ignore lint/suspicious/noExplicitAny: Event handlers require any[] for variadic callback signatures
	TEventMap extends Record<string, (...args: any[]) => void> = EIP1193EventMap,
> {
	/**
	 * Execute JSON-RPC request
	 *
	 * @param args - Request arguments (method + params)
	 * @param options - Optional request configuration (retry, timeout)
	 * @returns Promise resolving to method-specific return type
	 *
	 * @example
	 * ```typescript
	 * const blockNumber = await provider.request({
	 *   method: 'eth_blockNumber',
	 *   params: []
	 * });
	 * ```
	 */
	request: EIP1193RequestFn<TRpcSchema>;

	/**
	 * Register event listener
	 *
	 * @param event - Event name
	 * @param listener - Event handler
	 *
	 * @example
	 * ```typescript
	 * provider.on('chainChanged', (chainId: string) => {
	 *   console.log('Chain changed to:', chainId);
	 * });
	 * ```
	 */
	on<TEvent extends keyof TEventMap>(
		event: TEvent,
		listener: TEventMap[TEvent],
	): this;

	/**
	 * Remove event listener
	 *
	 * @param event - Event name
	 * @param listener - Event handler to remove
	 */
	removeListener<TEvent extends keyof TEventMap>(
		event: TEvent,
		listener: TEventMap[TEvent],
	): this;
}

/**
 * Standard EIP-1193 provider type alias
 *
 * Uses generic RpcSchema (any methods) with standard EIP-1193 events
 */
export type EIP1193Provider = TypedProvider<RpcSchema, EIP1193EventMap>;
