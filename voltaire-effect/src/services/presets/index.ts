/**
 * @fileoverview Layer composition presets for common client configurations.
 * 
 * @module presets
 * @since 0.0.1
 * 
 * @description
 * Provides convenient helper functions for composing common layer configurations.
 * These presets reduce boilerplate when setting up public clients with transports.
 * 
 * @example Using MainnetPublicClient
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, MainnetPublicClient } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getChainId()
 * }).pipe(Effect.provide(MainnetPublicClient('https://mainnet.infura.io/v3/YOUR_KEY')))
 * 
 * await Effect.runPromise(program)
 * ```
 */

import * as Layer from 'effect/Layer'
import { PublicClient } from '../PublicClient/index.js'
import { HttpTransport } from '../Transport/index.js'
import type { PublicClientService } from '../PublicClient/index.js'

/**
 * Creates a pre-composed PublicClient layer with HTTP transport.
 * 
 * @description
 * Convenience function that composes PublicClient with HttpTransport,
 * reducing boilerplate for the most common use case.
 * 
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing PublicClientService (fully satisfied, no dependencies)
 * 
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, MainnetPublicClient } from 'voltaire-effect/services'
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   const blockNumber = yield* client.getBlockNumber()
 *   const chainId = yield* client.getChainId()
 *   return { blockNumber, chainId }
 * }).pipe(Effect.provide(MainnetPublicClient('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')))
 * 
 * await Effect.runPromise(program)
 * ```
 */
export const MainnetPublicClient = (url: string): Layer.Layer<PublicClientService> =>
  PublicClient.pipe(Layer.provide(HttpTransport(url)))

/**
 * Creates a pre-composed PublicClient layer with HTTP transport.
 * 
 * @description
 * Generic version of MainnetPublicClient for any network.
 * Composes PublicClient with HttpTransport for the given URL.
 * 
 * @param url - The JSON-RPC endpoint URL
 * @returns A composed layer providing PublicClientService (fully satisfied, no dependencies)
 * 
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { PublicClientService, createPublicClient } from 'voltaire-effect/services'
 * 
 * // Works with any network
 * const arbitrumClient = createPublicClient('https://arb1.arbitrum.io/rpc')
 * const optimismClient = createPublicClient('https://mainnet.optimism.io')
 * 
 * const program = Effect.gen(function* () {
 *   const client = yield* PublicClientService
 *   return yield* client.getChainId()
 * }).pipe(Effect.provide(arbitrumClient))
 * ```
 */
export const createPublicClient = (url: string): Layer.Layer<PublicClientService> =>
  PublicClient.pipe(Layer.provide(HttpTransport(url)))
