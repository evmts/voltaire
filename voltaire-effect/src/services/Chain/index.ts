/**
 * @fileoverview Chain module exports for blockchain network configuration.
 *
 * @module Chain
 * @since 0.0.1
 *
 * @description
 * This module provides the chain service for blockchain network configuration.
 * It includes the service definition, chain configs, and Layer implementations.
 *
 * Main exports:
 * - {@link ChainService} - The service tag/interface
 * - {@link ChainConfig} - Chain configuration type
 * - {@link ChainContract} - Contract deployment info type
 *
 * Chain exports:
 * - {@link mainnet} - Ethereum mainnet
 * - {@link sepolia} - Sepolia testnet
 * - {@link optimism} - Optimism L2
 * - {@link arbitrum} - Arbitrum One L2
 * - {@link base} - Base L2
 * - {@link polygon} - Polygon
 *
 * @example Using ChainService with mainnet
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, mainnet } from 'voltaire-effect/services/Chain'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(`Chain: ${chain.name} (${chain.id})`)
 *   return chain
 * }).pipe(Effect.provide(mainnet))
 * ```
 */

export {
	type ChainConfig,
	type ChainContract,
	ChainService,
} from "./ChainService.js";

export {
	arbitrum,
	arbitrumConfig,
	base,
	baseConfig,
	mainnet,
	mainnetConfig,
	optimism,
	optimismConfig,
	polygon,
	polygonConfig,
	sepolia,
	sepoliaConfig,
} from "./chains/index.js";
