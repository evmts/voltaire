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
 * ### PublicClient
 * Read-only blockchain operations (blocks, transactions, balances).
 * - {@link PublicClientService} - Service interface
 * - {@link PublicClient} - Live implementation layer
 * 
 * ### WalletClient
 * Signing and transaction operations.
 * - {@link WalletClientService} - Service interface
 * - {@link WalletClientLive} - Live implementation layer
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
 *   PublicClientService, 
 *   PublicClient, 
 *   HttpTransport 
 * } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getBlockNumber()
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * 
 * await Effect.runPromise(program)
 * ```
 */

// Transport exports
export { TransportService, TransportError, type TransportShape } from "./Transport/index.js";
export { HttpTransport } from "./Transport/index.js";
export { WebSocketTransport } from "./Transport/index.js";
export { BrowserTransport } from "./Transport/index.js";
export { TestTransport } from "./Transport/index.js";

// PublicClient exports
export {
  PublicClientService,
  PublicClientError,
  type PublicClientShape,
  type BlockTag as PublicClientBlockTag,
  type BlockType,
  type TransactionType,
  type ReceiptType,
  type LogType,
  type AccessListType,
  type FeeHistoryType,
  type CallRequest,
  type LogFilter as PublicClientLogFilter
} from "./PublicClient/index.js";
export { PublicClient } from "./PublicClient/index.js";

// WalletClient exports
export {
  WalletClientService,
  WalletClientError,
  type WalletClientShape,
  type TransactionRequest,
} from "./WalletClient/index.js";
export { WalletClientLive } from "./WalletClient/index.js";

// Account exports
export { 
  AccountService, 
  AccountError,
  type AccountShape,
  type UnsignedTransaction,
} from "./Account/index.js";
export { LocalAccount } from "./Account/index.js";
export { JsonRpcAccount } from "./Account/index.js";

// Contract exports
export { Contract } from "./Contract/index.js";
export {
  ContractError,
  ContractCallError,
  ContractWriteError,
  ContractEventError,
  type ContractInstance,
  type EventFilter,
  type DecodedEvent,
  type BlockTag as ContractBlockTag,
  type Abi as ContractAbi,
  type AbiItem as ContractAbiItem,
} from "./Contract/index.js";
