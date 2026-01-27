/**
 * @fileoverview Sepolia testnet chain configuration.
 *
 * @module sepolia
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
 * Sepolia testnet configuration.
 *
 * @since 0.0.1
 */
export const sepoliaConfig: ChainConfig = {
	id: 11_155_111,
	name: "Sepolia",
	nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
	blockTime: 12_000,
	testnet: true,
};

/**
 * Sepolia testnet block explorer configuration.
 *
 * @since 0.0.1
 */
export const sepoliaBlockExplorers: BlockExplorerConfig = {
	default: {
		name: "Etherscan",
		url: "https://sepolia.etherscan.io",
		apiUrl: "https://api-sepolia.etherscan.io/api",
	},
};

/**
 * Sepolia testnet contract deployments.
 *
 * @since 0.0.1
 */
export const sepoliaContracts: ContractsConfig = {
	multicall3: {
		address: "0xca11bde05977b3631167028862be2a173976ca11",
		blockCreated: 751_532,
	},
	ensUniversalResolver: {
		address: "0xeeeeeeee14d718c2b47d9923deab1335e144eeee",
		blockCreated: 8_928_790,
	},
};

/**
 * Sepolia testnet Layer for chain metadata, explorers, and contracts.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, sepolia } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.testnet) // true
 * }).pipe(Effect.provide(sepolia))
 * ```
 */
export const sepolia = Layer.mergeAll(
	Layer.succeed(ChainService, sepoliaConfig),
	Layer.succeed(BlockExplorerService, sepoliaBlockExplorers),
	Layer.succeed(ContractsService, sepoliaContracts),
);
