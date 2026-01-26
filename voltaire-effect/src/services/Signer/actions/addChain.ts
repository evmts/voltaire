/**
 * @fileoverview Add chain action for EIP-3085 wallet_addEthereumChain.
 *
 * @module Signer/actions/addChain
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { TransportService } from "../../Transport/index.js";
import {
	type ChainConfig,
	type NativeCurrency,
	SignerError,
} from "../SignerService.js";

export type { ChainConfig, NativeCurrency };

/**
 * Requests the wallet to add a new chain (EIP-3085).
 *
 * @description
 * Sends a wallet_addEthereumChain request to add a new network to the user's wallet.
 * If the chain is already added, the wallet may switch to it instead.
 *
 * @param chain - Chain configuration to add
 * @returns Effect that succeeds when chain is added/switched
 *
 * @example
 * ```typescript
 * yield* addChain({
 *   id: 137,
 *   name: 'Polygon',
 *   nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
 *   rpcUrls: { default: { http: ['https://polygon-rpc.com'] } },
 *   blockExplorers: { default: { name: 'Polygonscan', url: 'https://polygonscan.com' } }
 * });
 * ```
 *
 * @since 0.0.1
 */
export const addChain = (
	chain: ChainConfig,
): Effect.Effect<void, SignerError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		const chainIdHex = `0x${chain.id.toString(16)}`;
		const rpcUrls = chain.rpcUrls.default.http;
		const blockExplorerUrls = chain.blockExplorers?.default.url
			? [chain.blockExplorers.default.url]
			: undefined;

		yield* transport
			.request<null>("wallet_addEthereumChain", [
				{
					chainId: chainIdHex,
					chainName: chain.name,
					nativeCurrency: {
						name: chain.nativeCurrency.name,
						symbol: chain.nativeCurrency.symbol,
						decimals: chain.nativeCurrency.decimals,
					},
					rpcUrls,
					blockExplorerUrls,
				},
			])
			.pipe(
				Effect.mapError((e) => {
					const isUserRejected = e.code === 4001;
					const message = isUserRejected
						? "User rejected the request"
						: `Failed to add chain: ${e.message}`;
					return new SignerError({ action: "addChain", chain }, message, {
						cause: e,
						code: e.code,
						context: isUserRejected ? { userRejected: true } : undefined,
					});
				}),
			);
	});
