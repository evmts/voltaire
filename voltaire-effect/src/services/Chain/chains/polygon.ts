/**
 * @fileoverview Polygon chain configuration.
 *
 * @module polygon
 * @since 0.0.1
 */

import * as Layer from "effect/Layer";
import { type ChainConfig, ChainService } from "../ChainService.js";

/**
 * Polygon (formerly Matic) configuration.
 *
 * @since 0.0.1
 */
export const polygonConfig: ChainConfig = {
	id: 137,
	name: "Polygon",
	nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
	blockTime: 2_000,
	rpcUrls: {
		default: { http: ["https://polygon-rpc.com"] },
	},
	blockExplorers: {
		default: {
			name: "PolygonScan",
			url: "https://polygonscan.com",
			apiUrl: "https://api.etherscan.io/v2/api",
		},
	},
	contracts: {
		multicall3: {
			address: "0xca11bde05977b3631167028862be2a173976ca11",
			blockCreated: 25_770_160,
		},
	},
};

/**
 * Polygon Layer for ChainService.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, polygon } from 'voltaire-effect/services/Chain'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.nativeCurrency.symbol) // "POL"
 * }).pipe(Effect.provide(polygon))
 * ```
 */
export const polygon = Layer.succeed(ChainService, polygonConfig);
