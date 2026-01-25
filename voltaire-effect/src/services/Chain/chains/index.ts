/**
 * @fileoverview Chain configuration exports.
 *
 * @module chains
 * @since 0.0.1
 *
 * @description
 * Re-exports all predefined chain configurations as Effect Layers.
 * Each chain provides a ChainService with network-specific metadata.
 *
 * @example
 * ```typescript
 * import { mainnet, sepolia, optimism } from 'voltaire-effect/services/Chain/chains'
 * ```
 */

export { arbitrum, arbitrumConfig } from "./arbitrum.js";
export { base, baseConfig } from "./base.js";
export { mainnet, mainnetConfig } from "./mainnet.js";
export { optimism, optimismConfig } from "./optimism.js";
export { polygon, polygonConfig } from "./polygon.js";
export { sepolia, sepoliaConfig } from "./sepolia.js";
