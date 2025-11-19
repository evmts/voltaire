/**
 * Provider - EIP-1193 Compliant Ethereum JSON-RPC Provider
 *
 * EIP-1193 compliant provider implementations for Ethereum JSON-RPC communication.
 * Supports HTTP, WebSocket, and in-memory (EVM-based) transports.
 *
 * ## Features
 *
 * - **EIP-1193 compliant** - Single `request()` method for all RPC calls
 * - **EventEmitter** - Standard event handling for blockchain events
 * - **Throws on error** - Clean error handling with RpcError
 * - **Type-safe** - Full TypeScript support with branded primitives
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

// Core types and interfaces
export type { Provider } from "./Provider.js";
export type {
	RequestArguments,
	RpcError,
	RequestOptions,
	BlockTag,
	ProviderEventListener,
	ProviderConnectInfo,
	ProviderEventMap,
	ProviderEvent,
} from "./types.js";
export { ProviderRpcErrorCode } from "./types.js";

// Provider implementations
export { HttpProvider } from "./HttpProvider.js";
export type { HttpProviderOptions } from "./HttpProvider.js";

export { WebSocketProvider } from "./WebSocketProvider.js";
export type { WebSocketProviderOptions } from "./WebSocketProvider.js";

export { InMemoryProvider } from "./InMemoryProvider.js";
export type { InMemoryProviderOptions } from "./InMemoryProvider.js";
