/**
 * @fileoverview NonceManager module exports for transaction nonce management.
 *
 * @module NonceManager
 * @since 0.0.1
 *
 * @description
 * This module provides the nonce manager service for tracking and managing
 * transaction nonces. It includes the service definition, layer implementation,
 * and all related types.
 *
 * Main exports:
 * - {@link NonceManagerService} - The service tag/interface
 * - {@link DefaultNonceManager} - The live implementation layer
 * - {@link NonceError} - Error type for failed operations
 *
 * @example Typical usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   NonceManagerService,
 *   DefaultNonceManager,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const nonceManager = yield* NonceManagerService
 *   const nonce = yield* nonceManager.consume('0x1234...')
 *   return nonce
 * }).pipe(
 *   Effect.provide(DefaultNonceManager),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link ProviderService} - Required dependency for RPC communication
 */

export { DefaultNonceManager } from "./DefaultNonceManager.js";
export {
	NonceError,
	NonceManagerService,
	type NonceManagerShape,
} from "./NonceManagerService.js";
