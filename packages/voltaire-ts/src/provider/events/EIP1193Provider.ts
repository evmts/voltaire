/**
 * EIP-1193 Provider Types
 *
 * Supporting types for EIP-1193 events and connectivity.
 *
 * @module provider/events/EIP1193Provider
 */

/**
 * Connection information
 *
 * Provided in 'connect' event
 */
export interface ProviderConnectInfo {
	/** Chain ID as hex string (per eth_chainId) */
	readonly chainId: string;
}

/**
 * Provider message
 *
 * Used for 'message' event (subscriptions, notifications)
 */
export interface ProviderMessage {
	/** Message type identifier */
	readonly type: string;
	/** Message payload */
	readonly data: unknown;
}

/**
 * Ethereum subscription message
 *
 * Specialized message for eth_subscribe notifications
 */
export interface EthSubscription extends ProviderMessage {
	readonly type: "eth_subscription";
	readonly data: {
		subscription: string;
		result: unknown;
	};
}
