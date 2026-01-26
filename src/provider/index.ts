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
 * - **InMemoryProvider** - Local EVM execution for testing
 * - **ForkProvider** - Fork from upstream RPC with local state (StateManager + Blockchain FFI)
 *
 * @see https://voltaire.tevm.sh/provider for full documentation
 * @module provider
 */

// EIP-6963: Multi Injected Provider Discovery
export * as EIP6963 from "./eip6963/index.js";
export type {
	EIP1193EventEmitter,
	EIP1193EventMap,
	EthSubscription,
	ProviderConnectInfo,
	ProviderMessage,
} from "./events/index.js";
// Events module
export {
	EIP1193ErrorCode,
	JsonRpcErrorCode,
	ProviderRpcError,
} from "./events/index.js";
// Provider implementations
export { ForkProvider } from "./ForkProvider.js";
export type { ForkConfig, ForkProviderOptions } from "./ForkProviderOptions.js";
// Factory to create provider from a supplied Host/EVM
export { fromEvm } from "./fromEvm.js";
export type { HttpProviderOptions } from "./HttpProvider.js";
export { HttpProvider } from "./HttpProvider.js";
export type { InMemoryProviderOptions } from "./InMemoryProvider.js";
export { InMemoryProvider } from "./InMemoryProvider.js";
// Core types and interfaces (legacy)
export type { Provider } from "./Provider.js";
// RPC Schema system
export type {
	RpcMethodNames,
	RpcMethodParameters,
	RpcMethodReturnType,
	RpcSchema,
} from "./RpcSchema.js";
// Request module
export type {
	EIP1193RequestFn,
	EIP1193RequestOptions,
	RequestArguments,
} from "./request/index.js";
export { StateManagerHost } from "./StateManagerHost.js";
// Schemas
export type {
	DerivedRpcSchema,
	RpcSchemaOverride,
	VoltaireRpcSchema,
	BlockOverrides,
	StateOverride,
} from "./schemas/index.js";
// Strongly-typed provider types
export type { EIP1193Provider, TypedProvider } from "./TypedProvider.js";
export type {
	BlockTag,
	ProviderConnectInfo as LegacyProviderConnectInfo,
	ProviderEvent,
	ProviderEventListener,
	ProviderEventMap as LegacyProviderEventMap,
	RequestArguments as LegacyRequestArguments,
	RequestOptions,
	RpcError,
} from "./types.js";
export { ProviderRpcErrorCode } from "./types.js";
export type { WebSocketProviderOptions } from "./WebSocketProvider.js";
export { WebSocketProvider } from "./WebSocketProvider.js";
