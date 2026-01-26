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
import * as FiberRef from "effect/FiberRef";
import * as Layer from "effect/Layer";
import * as Duration from "effect/Duration";
import { timeoutRef, tracingRef } from "./config.js";
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
	request: (args: {
		method: string;
		params?: readonly unknown[] | object;
	}) => Promise<unknown>;
}

/**
 * Configuration options for custom transport.
 *
 * @since 0.0.1
 */
export interface CustomTransportConfig {
	/**
	 * The EIP-1193 provider to wrap.
	 * If omitted, CustomTransport will attempt to use an injected provider
	 * (window.ethereum or globalThis.ethereum).
	 */
	provider?: EIP1193Provider;
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Optional request interceptor */
	onRequest?: (method: string, params: unknown[]) => void | Promise<void>;
	/** Optional response interceptor */
	onResponse?: (method: string, result: unknown) => void | Promise<void>;
	/** Optional error interceptor */
	onError?: (method: string, error: TransportError) => void | Promise<void>;
}

type InjectedEthereumProvider = EIP1193Provider & {
	providers?: readonly EIP1193Provider[];
};

const isEip1193Provider = (value: unknown): value is EIP1193Provider =>
	!!value &&
	typeof value === "object" &&
	"request" in value &&
	typeof (value as { request: unknown }).request === "function";

const EIP1193_ERROR_MESSAGES: Record<number, string> = {
	4001: "User rejected the request",
	4100: "Unauthorized",
	4200: "Unsupported method",
	4900: "Disconnected",
	4901: "Chain disconnected",
};

const resolveInjectedProvider = (): EIP1193Provider | undefined => {
	if (typeof window !== "undefined" && window.ethereum) {
		const ethereum = window.ethereum as InjectedEthereumProvider;
		if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
			const provider = ethereum.providers.find(isEip1193Provider);
			if (provider) return provider;
		}
		if (isEip1193Provider(ethereum)) return ethereum;
	}

	const globalEthereum = (globalThis as { ethereum?: InjectedEthereumProvider })
		.ethereum;
	if (globalEthereum) {
		if (
			Array.isArray(globalEthereum.providers) &&
			globalEthereum.providers.length > 0
		) {
			const provider = globalEthereum.providers.find(isEip1193Provider);
			if (provider) return provider;
		}
		if (isEip1193Provider(globalEthereum)) return globalEthereum;
	}

	return undefined;
};

const toTransportError = (error: unknown): TransportError => {
	if (error instanceof TransportError) return error;

	if (error && typeof error === "object") {
		const record = error as { code?: unknown; message?: unknown; data?: unknown };
		const rawCode = record.code;
		const code =
			typeof rawCode === "string"
				? Number(rawCode)
				: (rawCode as number | undefined);
		if (typeof code === "number" && Number.isFinite(code)) {
			const message =
				typeof record.message === "string" && record.message.length > 0
					? record.message
					: EIP1193_ERROR_MESSAGES[code] ?? "Provider error";
			return new TransportError({
				code,
				message,
				data: record.data,
			});
		}
	}

	return new TransportError({
		code: -32603,
		message: error instanceof Error ? error.message : "Unknown provider error",
	});
};

/**
 * Creates a custom transport layer from an EIP-1193 provider.
 *
 * @description
 * Wraps any EIP-1193 compatible provider to work with the TransportService.
 * Supports optional interceptors for request/response logging or modification.
 * If no provider is supplied, it attempts to use an injected provider
 * (window.ethereum or globalThis.ethereum).
 *
 * The transport:
 * - Delegates all requests to the wrapped provider
 * - Converts provider errors to TransportError
 * - Optionally times out requests
 * - Calls interceptors at appropriate lifecycle points
 *
 * @param options - Provider or configuration object (optional)
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
	options?: CustomTransportConfig | EIP1193Provider,
): Layer.Layer<TransportService> => {
	const config: CustomTransportConfig =
		options && "request" in options && typeof options.request === "function"
			? { provider: options }
			: options ?? {};

	const baseTimeout = config.timeout ?? 30000;

	return Layer.succeed(TransportService, {
		request: <T>(method: string, params: unknown[] = []) =>
			Effect.gen(function* () {
				const timeoutOverride = yield* FiberRef.get(timeoutRef);
				const tracingEnabled = yield* FiberRef.get(tracingRef);
				const timeoutMs = timeoutOverride ?? baseTimeout;
				// Call request interceptor
				const provider = config.provider ?? resolveInjectedProvider();
				if (!provider) {
					return yield* Effect.fail(
						new TransportError({
							code: -32603,
							message:
								"No EIP-1193 provider found. Provide a provider or install an injected wallet (window.ethereum).",
						}),
					);
				}

				if (config.onRequest) {
					yield* Effect.tryPromise({
						try: () => Promise.resolve(config.onRequest!(method, params)),
						catch: () => void 0,
					});
				}

				if (tracingEnabled) {
					yield* Effect.logDebug(`rpc ${method} -> custom transport`);
				}

				const resultEffect = Effect.tryPromise({
					try: () => provider.request({ method, params }),
					catch: toTransportError,
				});

				const result = yield* resultEffect.pipe(
					Effect.timeout(Duration.millis(timeoutMs)),
					Effect.catchTag("TimeoutException", () =>
						Effect.fail(
							new TransportError({
								code: -32603,
								message: `Request timeout after ${timeoutMs}ms`,
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
	request: (args: {
		method: string;
		params?: readonly unknown[] | object;
	}) => Promise<unknown>,
	options?: Omit<CustomTransportConfig, "provider">,
): Layer.Layer<TransportService> =>
	CustomTransport({
		provider: { request },
		...options,
	});
