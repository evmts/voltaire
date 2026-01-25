/**
 * @fileoverview Account module exports for cryptographic signing operations.
 *
 * @module Account
 * @since 0.0.1
 *
 * @description
 * This module provides the account service for cryptographic signing.
 * Includes the service definition and two implementations:
 *
 * - {@link LocalAccount} - Signs locally with a private key
 * - {@link JsonRpcAccount} - Delegates signing to a JSON-RPC provider
 *
 * Main exports:
 * - {@link AccountService} - The service tag/interface
 * - {@link LocalAccount} - Local private key layer
 * - {@link JsonRpcAccount} - Remote JSON-RPC layer
 * - {@link AccountError} - Error type for failed operations
 *
 * Type exports:
 * - {@link AccountShape} - Service interface shape
 * - {@link UnsignedTransaction} - Transaction for signing
 *
 * @example Using LocalAccount
 * ```typescript
 * import { Effect } from 'effect'
 * import { AccountService, LocalAccount } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   return yield* account.signMessage(messageHex)
 * }).pipe(Effect.provide(LocalAccount(privateKey)))
 * ```
 *
 * @example Using JsonRpcAccount
 * ```typescript
 * import { Effect } from 'effect'
 * import { AccountService, JsonRpcAccount, BrowserTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   return yield* account.signMessage(messageHex)
 * }).pipe(
 *   Effect.provide(JsonRpcAccount(userAddress)),
 *   Effect.provide(BrowserTransport)
 * )
 * ```
 *
 * @see {@link WalletClientService} - Uses AccountService for transaction signing
 */

export {
	AccountError,
	AccountService,
	type AccountShape,
	type UnsignedTransaction,
} from "./AccountService.js";
export { JsonRpcAccount } from "./JsonRpcAccount.js";
export { LocalAccount } from "./LocalAccount.js";
