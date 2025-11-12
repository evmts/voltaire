/**
 * Provider - Type-safe Ethereum JSON-RPC Provider
 *
 * Provider implementations with branded primitive types and async generator events.
 * Supports HTTP, WebSocket, and in-memory (EVM-based) transports.
 *
 * ## Features
 *
 * - **Method-based API** - Call methods directly: `provider.eth_blockNumber()`
 * - **Branded primitives** - Type-safe parameters using Address, Hash, Hex types
 * - **Never throws** - Methods return `Response<T>` with result or error
 * - **Async generator events** - Subscribe with `for await` loops
 * - **Multiple transports** - HTTP, WebSocket, or in-memory execution
 *
 * ## Quick Start
 *
 * ```typescript
 * import { HttpProvider } from '@tevm/voltaire/provider';
 *
 * const provider = new HttpProvider('https://eth.example.com');
 *
 * const result = await provider.eth_blockNumber();
 * if (!result.error) {
 *   console.log('Block:', result.result);
 * }
 * ```
 *
 * ## Available Providers
 *
 * - **HttpProvider** - HTTP transport with polling-based events
 * - **WebSocketProvider** - WebSocket transport with native pub/sub
 * - **InMemoryProvider** - Local EVM execution (coming with EVM docs)
 *
 * @see https://voltaire.tevm.sh/provider for full documentation
 * @module provider
 */

// Core types and interfaces
export type { Provider } from "./Provider.js";
export type {
	Response,
	RpcError,
	RequestOptions,
	BlockTag,
	LogsParams,
	ProviderEvents,
} from "./types.js";

// Provider implementations
export { HttpProvider } from "./HttpProvider.js";
export type { HttpProviderOptions } from "./HttpProvider.js";

export { WebSocketProvider } from "./WebSocketProvider.js";
export type { WebSocketProviderOptions } from "./WebSocketProvider.js";

export { InMemoryProvider } from "./InMemoryProvider.js";
export type { InMemoryProviderOptions } from "./InMemoryProvider.js";
