/**
 * @fileoverview Base L2 chain configuration.
 *
 * @module base
 * @since 0.0.1
 */

import * as Layer from "effect/Layer";
import { type ChainConfig, ChainService } from "../ChainService.js";

/**
 * Base L2 configuration.
 *
 * @since 0.0.1
 */
export const baseConfig: ChainConfig = {
	id: 8453,
	name: "Base",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	blockTime: 2_000,
	rpcUrls: {
		default: { http: ["https://mainnet.base.org"] },
	},
	blockExplorers: {
		default: {
			name: "Basescan",
			url: "https://basescan.org",
			apiUrl: "https://api.basescan.org/api",
		},
	},
	contracts: {
		multicall3: {
			address: "0xca11bde05977b3631167028862be2a173976ca11",
			blockCreated: 5_022,
		},
	},
};

/**
 * Base L2 Layer for ChainService.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, base } from 'voltaire-effect/services/Chain'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.id) // 8453
 * }).pipe(Effect.provide(base))
 * ```
 */
export const base = Layer.succeed(ChainService, baseConfig);
