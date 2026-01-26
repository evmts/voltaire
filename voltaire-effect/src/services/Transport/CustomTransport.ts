/**
 * @fileoverview Custom transport for wrapping EIP-1193 providers.
 *
 * @module CustomTransport
 * @since 0.0.1
 *
 * @description
 * Provides a transport layer that wraps any EIP-1193 compatible provider.
 * This allows using existing providers (ethers, web3.js, custom) with the
 * Effect-based transport system.
 *
 * Features:
 * - Wraps any EIP-1193 provider
 * - Proper error conversion
 * - Request/response interceptors
 * - Optional request timeout
 *
 * Use CustomTransport when:
 * - Integrating with existing provider instances
 * - Need custom provider behavior
 * - Wrapping third-party provider libraries
 *
 * @see {@link TransportService} - The service interface this implements
 * @see {@link BrowserTransport} - For window.ethereum specifically
 * @see {@link HttpTransport} - For HTTP-based JSON-RPC
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Duration from "effect/Duration";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";

/**
 * EIP-1193 compatible Ethereum provider interface.
 *
 * @description
 * Standard interface for Ethereum providers as defined in EIP-1193.
 * All compliant providers (MetaMask, ethers, web3.js, etc.) implement this.
 *
 * @since 0.0.1
 * @see https://eips.ethereum.org/EIPS/eip-1193
 */
export interface EIP1193Provider {
	/**
	 * Sends a JSON-RPC request to the provider.
	 * @param args - Request arguments with method and optional params
	 * @returns Promise resolving to the RPC result
	 */
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/**
 * Configuration options for custom transport.
 *
 * @since 0.0.1
 */
export interface CustomTransportConfig {
	/** The EIP-1193 provider to wrap */
	provider: EIP1193Provider;
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Optional request interceptor */
	onRequest?: (method: string, params: unknown[]) => void | Promise<void>;
	/** Optional response interceptor */
	onResponse?: (method: string, result: unknown) => void | Promise<void>;
	/** Optional error interceptor */
	onError?: (method: string, error: TransportError) => void | Promise<void>;
}

/**
 * Creates a custom transport layer from an EIP-1193 provider.
 *
 * @description
 * Wraps any EIP-1193 compatible provider to work with the TransportService.
 * Supports optional interceptors for request/response logging or modification.
 *
 * The transport:
 * - Delegates all requests to the wrapped provider
 * - Converts provider errors to TransportError
 * - Optionally times out requests
 * - Calls interceptors at appropriate lifecycle points
 *
 * @param options - Provider or configuration object
 * @returns Layer providing TransportService
 *
 * @throws {TransportError} When the provider rejects the request
 * @throws {TransportError} When the request times out
 *
 * @since 0.0.1
 *
 * @example Simple provider wrapping
 * ```typescript
 * import { Effect } from 'effect'
 * import { ethers } from 'ethers'
 * import { CustomTransport, TransportService } from 'voltaire-effect/services'
 *
 * const ethersProvider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/KEY')
 *
 * const transport = CustomTransport({ provider: ethersProvider })
 *
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService
 *   return yield* t.request<string>('eth_blockNumber')
 * }).pipe(Effect.provide(transport))
 * ```
 *
 * @example With interceptors for logging
 * ```typescript
 * import { Effect } from 'effect'
 * import { CustomTransport, TransportService } from 'voltaire-effect/services'
 *
 * const transport = CustomTransport({
 *   provider: myProvider,
 *   timeout: 60000,
 *   onRequest: (method, params) => {
 *     console.log(`-> ${method}`, params)
 *   },
 *   onResponse: (method, result) => {
 *     console.log(`<- ${method}`, result)
 *   },
 *   onError: (method, error) => {
 *     console.error(`!! ${method}`, error.message)
 *   }
 * })
 * ```
 *
 * @example Wrapping web3.js provider
 * ```typescript
 * import { Effect } from 'effect'
 * import Web3 from 'web3'
 * import { CustomTransport, TransportService } from 'voltaire-effect/services'
 *
 * const web3 = new Web3('https://mainnet.infura.io/v3/KEY')
 *
 * // Web3 providers are EIP-1193 compatible
 * const transport = CustomTransport({
 *   provider: web3.currentProvider as EIP1193Provider
 * })
 * ```
 */
export const CustomTransport = (
	options: CustomTransportConfig | EIP1193Provider,
): Layer.Layer<TransportService> => {
	const config: CustomTransportConfig =
		"request" in options && typeof options.request === "function"
			? { provider: options }
			: options;

	const timeout = config.timeout ?? 30000;

	return Layer.succeed(TransportService, {
		request: <T>(method: string, params: unknown[] = []) =>
			Effect.gen(function* () {
				// Call request interceptor
				if (config.onRequest) {
					yield* Effect.tryPromise({
						try: () => Promise.resolve(config.onRequest!(method, params)),
						catch: () => void 0,
					});
				}

				const resultEffect = Effect.tryPromise({
					try: () => config.provider.request({ method, params }),
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
							message: e instanceof Error ? e.message : "Unknown provider error",
						});
					},
				});

				const result = yield* resultEffect.pipe(
					Effect.timeout(Duration.millis(timeout)),
					Effect.catchTag("TimeoutException", () =>
						Effect.fail(
							new TransportError({
								code: -32603,
								message: `Request timeout after ${timeout}ms`,
							}),
						),
					),
					Effect.tapError((error) => {
						if (config.onError && error instanceof TransportError) {
							return Effect.tryPromise({
								try: () => Promise.resolve(config.onError!(method, error)),
								catch: () => void 0,
							});
						}
						return Effect.void;
					}),
				);

				// Call response interceptor
				if (config.onResponse) {
					yield* Effect.tryPromise({
						try: () => Promise.resolve(config.onResponse!(method, result)),
						catch: () => void 0,
					});
				}

				return result as T;
			}),
	});
};

/**
 * Creates a custom transport from a raw request function.
 *
 * @description
 * Alternative constructor that takes a raw request function instead of
 * a full provider object. Useful for creating minimal custom transports.
 *
 * @param request - Function that makes the RPC request
 * @param options - Optional configuration
 * @returns Layer providing TransportService
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { CustomTransportFromFn, TransportService } from 'voltaire-effect/services'
 *
 * const transport = CustomTransportFromFn(
 *   async ({ method, params }) => {
 *     const response = await fetch('https://rpc.example.com', {
 *       method: 'POST',
 *       body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
 *     })
 *     const json = await response.json()
 *     return json.result
 *   },
 *   { timeout: 60000 }
 * )
 * ```
 */
export const CustomTransportFromFn = (
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>,
	options?: Omit<CustomTransportConfig, "provider">,
): Layer.Layer<TransportService> =>
	CustomTransport({
		provider: { request },
		...options,
	});
