/**
 * @fileoverview Chain module for working with Ethereum chain configurations.
 * Provides Effect-based operations for validating and creating chain definitions.
 *
 * @description
 * This module provides comprehensive support for defining and validating
 * Ethereum chain configurations.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Chain from 'voltaire-effect/primitives/Chain'
 *
 * function switchChain(chain: Chain.ChainType) {
 *   // ...
 * }
 * ```
 *
 * Chain configs include:
 * - Chain ID (unique network identifier)
 * - Network name
 * - Native currency (ETH, MATIC, etc.)
 * - RPC endpoints
 * - Block explorers
 *
 * The format is compatible with viem/wagmi chain definitions.
 *
 * @example
 * ```typescript
 * import * as Chain from 'voltaire-effect/primitives/Chain'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a chain configuration
 * const ethereum = Effect.runSync(Chain.from({
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
 *   rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
 *   blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } }
 * }))
 * ```
 *
 * @module Chain
 * @since 0.0.1
 * @see {@link ChainSchema} for schema-based validation
 * @see {@link from} for Effect-wrapped creation
 */
export {
	type ChainInput,
	type ChainMetadata,
	ChainSchema,
	ChainSchema as Schema,
	type ChainType,
	type Explorer,
	type Hardfork,
	type NativeCurrency,
} from "./ChainSchema.js";
