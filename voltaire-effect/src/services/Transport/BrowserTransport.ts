/**
 * @fileoverview Browser transport implementation using window.ethereum provider.
 *
 * @module BrowserTransport
 * @since 0.0.1
 *
 * @description
 * Provides a transport layer that uses the browser's injected Ethereum provider
 * (window.ethereum). Compatible with MetaMask, Coinbase Wallet, and any other
 * EIP-1193 compliant wallet.
 *
 * Features:
 * - Uses existing browser wallet connection
 * - Supports all EIP-1193 methods
 * - Proper error handling and conversion
 * - Zero configuration required
 *
 * Use BrowserTransport when:
 * - Building browser-based dApps
 * - Want to use the user's existing wallet
 * - Need access to wallet-specific methods (signing, accounts)
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link HttpTransport} - Alternative for server-side or when no wallet
 * @see {@link SignerService} - For wallet-specific operations
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

/**
 * EIP-1193 compatible Ethereum provider interface.
 *
 * @description
 * Minimal interface for the injected window.ethereum provider as specified
 * in EIP-1193. All compliant wallets (MetaMask, Coinbase, etc.) implement this.
 *
 * @since 0.0.1
 *
 * @see https://eips.ethereum.org/EIPS/eip-1193
 */
interface EthereumProvider {
	/**
	 * Sends a JSON-RPC request to the provider.
	 * @param args - Request arguments with method and optional params
	 * @returns Promise resolving to the RPC result
	 */
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

declare global {
	interface Window {
		/** The injected Ethereum provider (MetaMask, Coinbase, etc.) */
		ethereum?: EthereumProvider;
	}
}

/**
 * Browser transport layer that uses the injected window.ethereum provider.
 *
 * @description
 * Provides a pre-configured Layer that uses the browser's injected Ethereum
 * provider for JSON-RPC communication. Works with MetaMask, Coinbase Wallet,
 * and other EIP-1193 compatible wallets.
 *
 * This transport:
 * - Checks for window.ethereum availability
 * - Converts wallet errors to TransportError
 * - Supports all standard JSON-RPC methods
 * - Enables wallet-specific methods (eth_requestAccounts, etc.)
 *
 * @throws {TransportError} When no browser wallet is found (code: -32603)
 * @throws {TransportError} When the wallet rejects the request
 * @throws {TransportError} When the user denies the request
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { BrowserTransport, TransportService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   const blockNumber = yield* transport.request<string>('eth_blockNumber')
 *   return BigInt(blockNumber)
 * }).pipe(Effect.provide(BrowserTransport))
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example With Provider for blockchain queries
 * ```typescript
 * import { Effect } from 'effect'
 * import { BrowserTransport, Provider, ProviderService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* ProviderService
 *   const [blockNumber, chainId] = yield* Effect.all([
 *     client.getBlockNumber(),
 *     client.getChainId()
 *   ])
 *   return { blockNumber, chainId }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(BrowserTransport)
 * )
 * ```
 *
 * @example Requesting wallet connection
 * ```typescript
 * import { Effect } from 'effect'
 * import { BrowserTransport, TransportService } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *
 *   // Request accounts (triggers wallet popup)
 *   const accounts = yield* transport.request<string[]>('eth_requestAccounts')
 *
 *   console.log('Connected accounts:', accounts)
 *   return accounts[0]
 * }).pipe(
 *   Effect.provide(BrowserTransport),
 *   Effect.catchTag('TransportError', (error) => {
 *     if (error.code === 4001) {
 *       console.log('User rejected the connection request')
 *     }
 *     return Effect.fail(error)
 *   })
 * )
 * ```
 *
 * @example Error handling for missing wallet
 * ```typescript
 * import { Effect } from 'effect'
 * import { BrowserTransport, TransportService, TransportError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request<string>('eth_chainId')
 * }).pipe(
 *   Effect.provide(BrowserTransport),
 *   Effect.catchTag('TransportError', (error) => {
 *     if (error.message.includes('No browser wallet found')) {
 *       // Prompt user to install MetaMask
 *       window.open('https://metamask.io', '_blank')
 *     }
 *     return Effect.fail(error)
 *   })
 * )
 * ```
 *
 * @see {@link TransportService} - The service interface
 * @see {@link TransportError} - Error type thrown on failure
 * @see {@link SignerService} - For wallet signing operations
 * @see {@link HttpTransport} - For server-side or fallback transport
 */
export const BrowserTransport: Layer.Layer<TransportService> = Layer.succeed(
	TransportService,
	{
		request: <T>(method: string, params: unknown[] = []): Effect.Effect<T, TransportError> =>
			Effect.gen(function* () {
				if (typeof window === "undefined" || !window.ethereum) {
					return yield* Effect.fail(
						new TransportError({
							code: -32603,
							message:
								"No browser wallet found. Please install MetaMask or another EIP-1193 compatible wallet.",
						}),
					);
				}

				const result = yield* Effect.tryPromise({
					try: () => window.ethereum!.request({ method, params }),
					catch: (e) => {
						if (e && typeof e === "object" && "code" in e && "message" in e) {
							return new TransportError({
								code: (e as { code: number }).code,
								message: (e as { message: string }).message,
								data: "data" in e ? (e as { data: unknown }).data : undefined,
							});
						}
						return new TransportError({
							code: -32603,
							message: e instanceof Error ? e.message : "Unknown error",
						});
					},
				});

				return result as T;
			}),
	},
);
