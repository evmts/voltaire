/**
 * EIP-1193 Events
 *
 * Event types and emitter interface for EIP-1193 providers.
 *
 * @module provider/events/EIP1193Events
 */

import type {
	ProviderConnectInfo,
	ProviderMessage,
} from "./EIP1193Provider.js";
import type { ProviderRpcError } from "./ProviderRpcError.js";

/**
 * Standard EIP-1193 event map
 *
 * Defines the five standard events specified in EIP-1193.
 * Providers MAY extend this with custom events.
 *
 * @example
 * ```typescript
 * // Standard events only
 * type StandardProvider = {
 *   on<TEvent extends keyof EIP1193EventMap>(
 *     event: TEvent,
 *     listener: EIP1193EventMap[TEvent]
 *   ): void;
 * };
 *
 * // Extended events
 * type ExtendedEventMap = EIP1193EventMap & {
 *   newBlock(block: Block): void;
 *   newTransaction(tx: Transaction): void;
 * };
 * ```
 */
export interface EIP1193EventMap extends Record<string, (...args: any[]) => void> {
	/**
	 * Emitted when Provider connects to a chain
	 *
	 * @param connectInfo - Chain connection information
	 *
	 * @example
	 * ```typescript
	 * provider.on('connect', ({ chainId }) => {
	 *   console.log('Connected to chain:', chainId);
	 * });
	 * ```
	 */
	connect(connectInfo: ProviderConnectInfo): void;

	/**
	 * Emitted when Provider disconnects from ALL chains
	 *
	 * @param error - Disconnect error (code from CloseEvent spec)
	 *
	 * @example
	 * ```typescript
	 * provider.on('disconnect', (error) => {
	 *   console.error('Disconnected:', error.message, error.code);
	 * });
	 * ```
	 */
	disconnect(error: ProviderRpcError): void;

	/**
	 * Emitted when active chain changes
	 *
	 * @param chainId - New chain ID (hex string per eth_chainId)
	 *
	 * @example
	 * ```typescript
	 * provider.on('chainChanged', (chainId) => {
	 *   console.log('Switched to chain:', parseInt(chainId, 16));
	 * });
	 * ```
	 */
	chainChanged(chainId: string): void;

	/**
	 * Emitted when available accounts change
	 *
	 * @param accounts - New accounts array (per eth_accounts)
	 *
	 * @example
	 * ```typescript
	 * provider.on('accountsChanged', (accounts) => {
	 *   if (accounts.length === 0) {
	 *     console.log('Disconnected');
	 *   } else {
	 *     console.log('Active account:', accounts[0]);
	 *   }
	 * });
	 * ```
	 */
	accountsChanged(accounts: string[]): void;

	/**
	 * Emitted for arbitrary notifications (subscriptions, etc)
	 *
	 * @param message - Provider message
	 *
	 * @example
	 * ```typescript
	 * provider.on('message', ({ type, data }) => {
	 *   if (type === 'eth_subscription') {
	 *     console.log('Subscription update:', data);
	 *   }
	 * });
	 * ```
	 */
	message(message: ProviderMessage): void;
}

/**
 * Generic event emitter interface
 *
 * @template TEventMap - Event map defining available events
 */
export interface EIP1193EventEmitter<
	TEventMap extends Record<string, (...args: any[]) => void> = EIP1193EventMap,
> {
	/**
	 * Register event listener
	 */
	on<TEvent extends keyof TEventMap>(
		event: TEvent,
		listener: TEventMap[TEvent],
	): this;

	/**
	 * Remove event listener
	 */
	removeListener<TEvent extends keyof TEventMap>(
		event: TEvent,
		listener: TEventMap[TEvent],
	): this;

	/**
	 * Emit event (internal use)
	 * @internal
	 */
	emit(eventName: keyof TEventMap, ...args: any[]): boolean;
}
