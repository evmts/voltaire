/**
 * @fileoverview Chain configuration exports.
 *
 * @module chains
 * @since 0.0.1
 *
 * @description
 * Re-exports all predefined chain configurations as Effect Layers.
 * Each chain provides ChainService, BlockExplorerService, and ContractsService
 * with network-specific metadata.
 *
 * @example
 * ```typescript
 * import { mainnet, sepolia, optimism } from 'voltaire-effect/services/Chain/chains'
 * ```
 */

export {
	arbitrum,
	arbitrumBlockExplorers,
	arbitrumConfig,
	arbitrumContracts,
} from "./arbitrum.js";
export { base, baseBlockExplorers, baseConfig, baseContracts } from "./base.js";
export {
	mainnet,
	mainnetBlockExplorers,
	mainnetConfig,
	mainnetContracts,
} from "./mainnet.js";
export {
	optimism,
	optimismBlockExplorers,
	optimismConfig,
	optimismContracts,
} from "./optimism.js";
export {
	polygon,
	polygonBlockExplorers,
	polygonConfig,
	polygonContracts,
} from "./polygon.js";
export {
	sepolia,
	sepoliaBlockExplorers,
	sepoliaConfig,
	sepoliaContracts,
} from "./sepolia.js";
