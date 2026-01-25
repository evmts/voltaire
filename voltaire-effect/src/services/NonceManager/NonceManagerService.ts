/**
 * @fileoverview NonceManager service definition for transaction nonce management.
 *
 * @module NonceManagerService
 * @since 0.0.1
 *
 * @description
 * The NonceManagerService provides a high-level interface for managing transaction
 * nonces. It tracks local nonce deltas to allow multiple transactions to be sent
 * without waiting for each to be mined.
 *
 * This is essential for high-throughput applications that need to send multiple
 * transactions in quick succession.
 *
 * @see {@link DefaultNonceManager} - The live implementation layer
 * @see {@link ProviderService} - Required dependency for fetching on-chain nonces
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type { ProviderService } from "../Provider/index.js";

/**
 * Error thrown when a nonce operation fails.
 *
 * @description
 * Contains the address and error details for debugging.
 *
 * @since 0.0.1
 *
 * @example Handling NonceError
 * ```typescript
 * import { Effect } from 'effect'
 * import { NonceManagerService, NonceError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const nonceManager = yield* NonceManagerService
 *   return yield* nonceManager.get('0x...')
 * }).pipe(
 *   Effect.catchTag('NonceError', (error) => {
 *     console.error('Failed for address:', error.address, error.message)
 *     return Effect.succeed(0)
 *   })
 * )
 * ```
 */
export class NonceError extends Data.TaggedError("NonceError")<{
	readonly address: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Shape of the nonce manager service.
 *
 * @description
 * Defines the nonce management operations available through NonceManagerService.
 *
 * @since 0.0.1
 */
export type NonceManagerShape = {
	/**
	 * Gets the current nonce for an address on a specific chain.
	 *
	 * @description
	 * Fetches the pending nonce from the provider and adds the local delta.
	 * Does not consume the nonce (delta remains unchanged).
	 *
	 * @param address - The address to get the nonce for
	 * @param chainId - The chain ID to scope the nonce to
	 * @returns The current nonce (on-chain pending + local delta)
	 */
	readonly get: (
		address: string,
		chainId: number,
	) => Effect.Effect<number, NonceError, ProviderService>;

	/**
	 * Gets and consumes the next nonce for an address on a specific chain.
	 *
	 * @description
	 * Fetches the pending nonce, adds the local delta, then increments the delta.
	 * Use this when preparing to send a transaction.
	 * This operation is atomic - safe for concurrent calls.
	 *
	 * @param address - The address to consume a nonce for
	 * @param chainId - The chain ID to scope the nonce to
	 * @returns The nonce to use for the next transaction
	 */
	readonly consume: (
		address: string,
		chainId: number,
	) => Effect.Effect<number, NonceError, ProviderService>;

	/**
	 * Increments the local delta for an address on a specific chain.
	 *
	 * @description
	 * Adds 1 to the tracked delta without fetching from the provider.
	 * Useful when you know a transaction was sent externally.
	 *
	 * @param address - The address to increment the delta for
	 * @param chainId - The chain ID to scope the nonce to
	 */
	readonly increment: (address: string, chainId: number) => Effect.Effect<void>;

	/**
	 * Resets the local delta for an address on a specific chain.
	 *
	 * @description
	 * Clears the tracked delta, so the next get() will return the
	 * on-chain pending nonce. Use after transactions are confirmed
	 * or if you need to resync with the network.
	 *
	 * @param address - The address to reset
	 * @param chainId - The chain ID to scope the nonce to
	 */
	readonly reset: (address: string, chainId: number) => Effect.Effect<void>;
};

/**
 * NonceManager service for transaction nonce management.
 *
 * @description
 * Provides methods for getting, consuming, and managing transaction nonces.
 * Tracks local deltas to allow multiple transactions to be prepared without
 * waiting for previous ones to be mined.
 *
 * The service maintains a delta per address that is added to the on-chain
 * pending nonce. This allows:
 * - Sending multiple transactions quickly
 * - Proper nonce sequencing without race conditions
 * - Easy reset when transactions are confirmed
 *
 * Requires ProviderService for fetching on-chain nonces.
 *
 * @since 0.0.1
 *
 * @example Basic usage
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
 *
 *   // Get next nonce for transaction
 *   const nonce = yield* nonceManager.consume('0x1234...')
 *
 *   // Use nonce in transaction...
 *
 *   return nonce
 * }).pipe(
 *   Effect.provide(DefaultNonceManager),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example Multiple transactions
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const nonceManager = yield* NonceManagerService
 *   const address = '0x1234...'
 *
 *   // Get nonces for 3 transactions
 *   const nonce1 = yield* nonceManager.consume(address) // e.g., 5
 *   const nonce2 = yield* nonceManager.consume(address) // e.g., 6
 *   const nonce3 = yield* nonceManager.consume(address) // e.g., 7
 *
 *   // Send transactions with these nonces...
 *
 *   // After all confirmed, reset
 *   yield* nonceManager.reset(address)
 * })
 * ```
 *
 * @see {@link DefaultNonceManager} - The live implementation layer
 * @see {@link NonceError} - Error type for failed operations
 * @see {@link ProviderService} - Required dependency
 */
export class NonceManagerService extends Context.Tag("NonceManagerService")<
	NonceManagerService,
	NonceManagerShape
>() {}
