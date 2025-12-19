/**
 * Events Module
 *
 * EIP-1193 event types and error handling.
 *
 * @module provider/events
 */

export {
	ProviderRpcError,
	EIP1193ErrorCode,
	JsonRpcErrorCode,
} from "./ProviderRpcError.js";

export type {
	ProviderConnectInfo,
	ProviderMessage,
	EthSubscription,
} from "./EIP1193Provider.js";

export type {
	EIP1193EventMap,
	EIP1193EventEmitter,
} from "./EIP1193Events.js";
