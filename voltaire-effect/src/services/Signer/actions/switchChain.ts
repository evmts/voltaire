/**
 * @fileoverview Switch chain action for wallet_switchEthereumChain.
 *
 * @module Signer/actions/switchChain
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { SignerError } from "../SignerService.js";
import { TransportService } from "../../Transport/index.js";

/**
 * Requests the wallet to switch to a different chain.
 *
 * @description
 * Sends a wallet_switchEthereumChain request to switch the active network.
 * If the chain is not added to the wallet, use addChain first.
 *
 * @param chainId - Target chain ID (e.g., 1 for mainnet, 137 for polygon)
 * @returns Effect that succeeds when chain is switched
 *
 * @example
 * ```typescript
 * // Switch to Polygon
 * yield* switchChain(137);
 *
 * // Switch to Ethereum mainnet
 * yield* switchChain(1);
 * ```
 *
 * @since 0.0.1
 */
export const switchChain = (
	chainId: number,
): Effect.Effect<void, SignerError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		yield* transport
			.request<null>("wallet_switchEthereumChain", [
				{ chainId: `0x${chainId.toString(16)}` },
			])
			.pipe(
				Effect.mapError(
					(e) =>
						new SignerError(
							{ action: "switchChain", chainId },
							`Failed to switch chain: ${e.message}`,
							{ cause: e, code: e.code },
						),
				),
			);
	});
