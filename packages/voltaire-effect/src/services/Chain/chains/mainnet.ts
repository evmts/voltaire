/**
 * @fileoverview Ethereum mainnet chain configuration.
 *
 * @module mainnet
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
 * Ethereum mainnet configuration.
 *
 * @since 0.0.1
 */
export const mainnetConfig: ChainConfig = {
	id: 1,
	name: "Ethereum",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	blockTime: 12_000,
};

/**
 * Ethereum mainnet block explorer configuration.
 *
 * @since 0.0.1
 */
export const mainnetBlockExplorers: BlockExplorerConfig = {
	default: {
		name: "Etherscan",
		url: "https://etherscan.io",
		apiUrl: "https://api.etherscan.io/api",
	},
};

/**
 * Ethereum mainnet contract deployments.
 *
 * @since 0.0.1
 */
export const mainnetContracts: ContractsConfig = {
	multicall3: {
		address: "0xca11bde05977b3631167028862be2a173976ca11",
		blockCreated: 14_353_601,
	},
	ensUniversalResolver: {
		address: "0xeeeeeeee14d718c2b47d9923deab1335e144eeee",
		blockCreated: 23_085_558,
	},
};

/**
 * Ethereum mainnet Layer for chain metadata, explorers, and contracts.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, mainnet } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.name) // "Ethereum"
 * }).pipe(Effect.provide(mainnet))
 * ```
 */
export const mainnet = Layer.mergeAll(
	Layer.succeed(ChainService, mainnetConfig),
	Layer.succeed(BlockExplorerService, mainnetBlockExplorers),
	Layer.succeed(ContractsService, mainnetContracts),
);
