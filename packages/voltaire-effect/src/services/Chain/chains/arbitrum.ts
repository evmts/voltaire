/**
 * @fileoverview Arbitrum One L2 chain configuration.
 *
 * @module arbitrum
 * @since 0.0.1
 */

import * as Layer from "effect/Layer";
import {
	type BlockExplorerConfig,
	BlockExplorerService,
} from "../BlockExplorerService.js";
import { type ChainConfig, ChainService } from "../ChainService.js";
import { type ContractsConfig, ContractsService } from "../ContractsService.js";

/**
 * Arbitrum One configuration.
 *
 * @since 0.0.1
 */
export const arbitrumConfig: ChainConfig = {
	id: 42_161,
	name: "Arbitrum One",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	blockTime: 250,
};

/**
 * Arbitrum block explorer configuration.
 *
 * @since 0.0.1
 */
export const arbitrumBlockExplorers: BlockExplorerConfig = {
	default: {
		name: "Arbiscan",
		url: "https://arbiscan.io",
		apiUrl: "https://api.arbiscan.io/api",
	},
};

/**
 * Arbitrum contract deployments.
 *
 * @since 0.0.1
 */
export const arbitrumContracts: ContractsConfig = {
	multicall3: {
		address: "0xca11bde05977b3631167028862be2a173976ca11",
		blockCreated: 7_654_707,
	},
};

/**
 * Arbitrum One L2 Layer for chain metadata, explorers, and contracts.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, arbitrum } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.id) // 42161
 * }).pipe(Effect.provide(arbitrum))
 * ```
 */
export const arbitrum = Layer.mergeAll(
	Layer.succeed(ChainService, arbitrumConfig),
	Layer.succeed(BlockExplorerService, arbitrumBlockExplorers),
	Layer.succeed(ContractsService, arbitrumContracts),
);
