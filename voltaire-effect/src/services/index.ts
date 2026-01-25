/**
 * @fileoverview Main services module exports for voltaire-effect.
 *
 * @module services
 * @since 0.0.1
 *
 * @description
 * This is the main entry point for all voltaire-effect services. It re-exports
 * all service definitions, implementations, and related types.
 *
 * ## Service Categories
 *
 * ### Transport
 * Low-level JSON-RPC communication with Ethereum nodes.
 * - {@link TransportService} - Service interface
 * - {@link HttpTransport} - HTTP transport layer
 * - {@link WebSocketTransport} - WebSocket transport layer
 * - {@link BrowserTransport} - Browser wallet (window.ethereum) transport
 * - {@link TestTransport} - Mock transport for testing
 *
 * ### Provider
 * Read-only blockchain operations (blocks, transactions, balances).
 * - {@link ProviderService} - Service interface
 * - {@link Provider} - Live implementation layer
 *
 * ### Signer
 * Signing and transaction operations.
 * - {@link SignerService} - Service interface
 * - {@link Signer} - Namespace with Live layer and composition helpers
 *
 * ### Account
 * Cryptographic signing implementations.
 * - {@link AccountService} - Service interface
 * - {@link LocalAccount} - Local private key signing
 * - {@link JsonRpcAccount} - Remote JSON-RPC signing
 *
 * ### Contract
 * Type-safe smart contract interactions.
 * - {@link Contract} - Factory to create contract instances
 *
 * @example Typical usage pattern
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   ProviderService,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * await Effect.runPromise(program)
 * ```
 */

// Account exports
export {
	AccountError,
	AccountService,
	type AccountShape,
	JsonRpcAccount,
	LocalAccount,
	type UnsignedTransaction,
} from "./Account/index.js";
// Contract exports
export {
	type Abi as ContractAbi,
	type AbiItem as ContractAbiItem,
	type BlockTag as ContractBlockTag,
	Contract,
	ContractCallError,
	ContractError,
	ContractEventError,
	type ContractInstance,
	ContractWriteError,
	type DecodedEvent,
	type EventFilter,
} from "./Contract/index.js";
// Provider exports
export {
	type AccessListType,
	type BlockTag as ProviderBlockTag,
	type BlockType,
	type CallRequest,
	type FeeHistoryType,
	type LogFilter as ProviderLogFilter,
	type LogType,
	Provider,
	ProviderError,
	ProviderService,
	type ProviderShape,
	type ReceiptType,
	type TransactionType,
} from "./Provider/index.js";
// Preset exports (layer composition helpers)
export { createProvider, MainnetProvider } from "./presets/index.js";
// Transport exports
export {
	BrowserTransport,
	HttpTransport,
	TestTransport,
	TransportError,
	TransportService,
	type TransportShape,
	WebSocketTransport,
} from "./Transport/index.js";
// Signer exports
export {
	Signer,
	SignerError,
	SignerService,
	type SignerShape,
	type TransactionRequest,
} from "./Signer/index.js";
