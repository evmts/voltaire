/**
 * @fileoverview Optimism L2 chain configuration.
 *
 * @module optimism
 * @since 0.0.1
 */

import * as Layer from "effect/Layer";
import { type ChainConfig, ChainService } from "../ChainService.js";

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
	rpcUrls: {
		default: { http: ["https://mainnet.optimism.io"] },
	},
	blockExplorers: {
		default: {
			name: "Optimism Explorer",
			url: "https://optimistic.etherscan.io",
			apiUrl: "https://api-optimistic.etherscan.io/api",
		},
	},
	contracts: {
		multicall3: {
			address: "0xca11bde05977b3631167028862be2a173976ca11",
			blockCreated: 4_286_263,
		},
	},
};

/**
 * Optimism L2 Layer for ChainService.
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
export const optimism = Layer.succeed(ChainService, optimismConfig);
