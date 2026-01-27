/**
 * @fileoverview Optimism L2 chain configuration.
 *
 * @module optimism
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
 * Optimism (OP Mainnet) configuration.
 *
 * @since 0.0.1
 */
export const optimismConfig: ChainConfig = {
	id: 10,
	name: "OP Mainnet",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	blockTime: 2_000,
};

/**
 * Optimism block explorer configuration.
 *
 * @since 0.0.1
 */
export const optimismBlockExplorers: BlockExplorerConfig = {
	default: {
		name: "Optimism Explorer",
		url: "https://optimistic.etherscan.io",
		apiUrl: "https://api-optimistic.etherscan.io/api",
	},
};

/**
 * Optimism contract deployments.
 *
 * @since 0.0.1
 */
export const optimismContracts: ContractsConfig = {
	multicall3: {
		address: "0xca11bde05977b3631167028862be2a173976ca11",
		blockCreated: 4_286_263,
	},
};

/**
 * Optimism L2 Layer for chain metadata, explorers, and contracts.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, optimism } from 'voltaire-effect/services/Chain'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.id) // 10
 * }).pipe(Effect.provide(optimism))
 * ```
 */
export const optimism = Layer.mergeAll(
	Layer.succeed(ChainService, optimismConfig),
	Layer.succeed(BlockExplorerService, optimismBlockExplorers),
	Layer.succeed(ContractsService, optimismContracts),
);
