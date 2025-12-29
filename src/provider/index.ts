/**
 * Provider - EIP-1193 Compliant Ethereum JSON-RPC Provider
 *
 * EIP-1193 compliant provider implementations for Ethereum JSON-RPC communication.
 * Supports HTTP, WebSocket, and in-memory (EVM-based) transports.
 *
 * ## Features
 *
 * - **EIP-1193 compliant** - Single `request()` method for all RPC calls
 * - **Strongly typed** - Full type safety with RpcSchema support
 * - **EventEmitter** - Standard event handling for blockchain events
 * - **Throws on error** - Clean error handling with RpcError
 * - **Multiple transports** - HTTP, WebSocket, or in-memory execution
 *
 * ## Quick Start
 *
 * ```typescript
 * import { HttpProvider } from '@tevm/voltaire/provider';
 *
 * const provider = new HttpProvider('https://eth.example.com');
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
 *
 * ## Available Providers
 *
 * - **HttpProvider** - HTTP transport with EventEmitter
 * - **WebSocketProvider** - WebSocket transport with native pub/sub
 * - **InMemoryProvider** - Local EVM execution (coming with EVM docs)
 *
 * @see https://voltaire.tevm.sh/provider for full documentation
 * @module provider
 */

// Core types and interfaces (legacy)
export type { Provider } from "./Provider.js";
export type {
	RequestArguments as LegacyRequestArguments,
	RpcError,
	RequestOptions,
	BlockTag,
	ProviderEventListener,
	ProviderConnectInfo as LegacyProviderConnectInfo,
	ProviderEventMap as LegacyProviderEventMap,
	ProviderEvent,
} from "./types.js";
export { ProviderRpcErrorCode } from "./types.js";

// Strongly-typed provider types
export type { TypedProvider, EIP1193Provider } from "./TypedProvider.js";

// RPC Schema system
export type {
	RpcSchema,
	RpcMethodNames,
	RpcMethodParameters,
	RpcMethodReturnType,
} from "./RpcSchema.js";

// Request module
export type {
	RequestArguments,
	EIP1193RequestFn,
	EIP1193RequestOptions,
} from "./request/index.js";

// Events module
export {
	ProviderRpcError,
	EIP1193ErrorCode,
	JsonRpcErrorCode,
} from "./events/index.js";
export type {
	ProviderConnectInfo,
	ProviderMessage,
	EthSubscription,
	EIP1193EventMap,
	EIP1193EventEmitter,
} from "./events/index.js";

// Schemas
export type {
	VoltaireRpcSchema,
	DerivedRpcSchema,
	RpcSchemaOverride,
} from "./schemas/index.js";

// Provider implementations
export { HttpProvider } from "./HttpProvider.js";
export type { HttpProviderOptions } from "./HttpProvider.js";

export { WebSocketProvider } from "./WebSocketProvider.js";
export type { WebSocketProviderOptions } from "./WebSocketProvider.js";

export { InMemoryProvider } from "./InMemoryProvider.js";
export type { InMemoryProviderOptions } from "./InMemoryProvider.js";

// EIP-6963: Multi Injected Provider Discovery
export * as EIP6963 from "./eip6963/index.js";

// Factory to create provider from a supplied Host/EVM
export { fromEvm } from "./fromEvm.js";
