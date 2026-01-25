/**
 * @fileoverview WalletClient module exports for signing and transaction operations.
 * 
 * @module WalletClient
 * @since 0.0.1
 * 
 * @description
 * This module provides the wallet client service for signing messages,
 * transactions, and typed data. It includes the service definition,
 * layer implementation, and all related types.
 * 
 * Main exports:
 * - {@link WalletClientService} - The service tag/interface
 * - {@link WalletClientLive} - The live implementation layer
 * - {@link WalletClientError} - Error type for failed operations
 * 
 * Type exports:
 * - {@link WalletClientShape} - Service interface shape
 * - {@link TransactionRequest} - Transaction parameters type
 * 
 * @example Typical usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { 
 *   WalletClientService, 
 *   WalletClientLive,
 *   LocalAccount,
 *   PublicClient,
 *   HttpTransport 
 * } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   return yield* wallet.sendTransaction({
 *     to: recipientAddress,
 *     value: 1000000000000000000n
 *   })
 * }).pipe(
 *   Effect.provide(WalletClientLive),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * 
 * @see {@link AccountService} - Required for signing operations
 * @see {@link PublicClientService} - Required for gas/nonce
 * @see {@link TransportService} - Required for transaction broadcast
 */

export {
	WalletClientService,
	WalletClientError,
	type WalletClientShape,
	type TransactionRequest,
} from "./WalletClientService.js";

export { WalletClientLive } from "./WalletClient.js";
