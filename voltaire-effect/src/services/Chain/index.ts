/**
 * @fileoverview Chain module exports for blockchain network configuration.
 *
 * @module Chain
 * @since 0.0.1
 *
 * @description
 * This module provides chain metadata services and configuration for
 * blockchain network configuration. It includes service definitions,
 * chain configs, RPC URL maps, and Layer implementations.
 *
 * Main exports:
 * - {@link ChainService} - The chain metadata service
 * - {@link BlockExplorerService} - Block explorer metadata service
 * - {@link ContractsService} - Well-known contract deployments service
 * - {@link ChainConfig} - Chain configuration type
 * - {@link ChainContract} - Contract deployment info type
 * - {@link rpcUrlsByChainId} - RPC URL map keyed by chain ID
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
	type BlockExplorerConfig,
	BlockExplorerService,
} from "./BlockExplorerService.js";
export { type ChainConfig, ChainService } from "./ChainService.js";
export {
	type ChainContract,
	type ContractsConfig,
	ContractsService,
} from "./ContractsService.js";
export {
	arbitrum,
	arbitrumBlockExplorers,
	arbitrumConfig,
	arbitrumContracts,
	base,
	baseBlockExplorers,
	baseConfig,
	baseContracts,
	mainnet,
	mainnetBlockExplorers,
	mainnetConfig,
	mainnetContracts,
	optimism,
	optimismBlockExplorers,
	optimismConfig,
	optimismContracts,
	polygon,
	polygonBlockExplorers,
	polygonConfig,
	polygonContracts,
	sepolia,
	sepoliaBlockExplorers,
	sepoliaConfig,
	sepoliaContracts,
} from "./chains/index.js";
export { type RpcUrlsConfig, rpcUrlsByChainId } from "./rpcUrls.js";
