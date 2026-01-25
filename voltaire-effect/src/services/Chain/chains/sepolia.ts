/**
 * @fileoverview Sepolia testnet chain configuration.
 *
 * @module sepolia
 * @since 0.0.1
 */

import * as Layer from "effect/Layer";
import { type ChainConfig, ChainService } from "../ChainService.js";

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
	rpcUrls: {
		default: { http: ["https://11155111.rpc.thirdweb.com"] },
	},
	blockExplorers: {
		default: {
			name: "Etherscan",
			url: "https://sepolia.etherscan.io",
			apiUrl: "https://api-sepolia.etherscan.io/api",
		},
	},
	contracts: {
		multicall3: {
			address: "0xca11bde05977b3631167028862be2a173976ca11",
			blockCreated: 751_532,
		},
		ensUniversalResolver: {
			address: "0xeeeeeeee14d718c2b47d9923deab1335e144eeee",
			blockCreated: 8_928_790,
		},
	},
	testnet: true,
};

/**
 * Sepolia testnet Layer for ChainService.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ChainService, sepolia } from 'voltaire-effect/services/Chain'
 *
 * const program = Effect.gen(function* () {
 *   const chain = yield* ChainService
 *   console.log(chain.testnet) // true
 * }).pipe(Effect.provide(sepolia))
 * ```
 */
export const sepolia = Layer.succeed(ChainService, sepoliaConfig);
