/**
 * @fileoverview Watch asset action for EIP-747 wallet_watchAsset.
 *
 * @module Signer/actions/watchAsset
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { SignerError } from "../SignerService.js";
import { TransportService } from "../../Transport/index.js";

/**
 * Asset options for wallet_watchAsset.
 *
 * @since 0.0.1
 */
export interface WatchAssetOptions {
	/** Contract address of the token */
	readonly address: `0x${string}`;
	/** Token symbol (optional, e.g., "USDC") */
	readonly symbol?: string;
	/** Token decimals (optional) */
	readonly decimals?: number;
	/** Optional URL to the token image */
	readonly image?: string;
}

/**
 * Asset type (currently only ERC20 is supported by most wallets).
 *
 * @since 0.0.1
 */
export type WatchAssetType = "ERC20";

/**
 * Parameters for watching an asset.
 *
 * @since 0.0.1
 */
export interface WatchAssetParams {
	/** Asset type (typically "ERC20") */
	readonly type: WatchAssetType;
	/** Asset options including address and optional metadata */
	readonly options: WatchAssetOptions;
}

/**
 * Requests the wallet to track a token (EIP-747).
 *
 * @description
 * Sends a wallet_watchAsset request to add a token to the wallet's tracked tokens.
 * The user will be prompted to confirm adding the token.
 *
 * @param asset - Asset parameters including type and options
 * @returns Effect yielding true if the token was added, false if rejected
 *
 * @example
 * ```typescript
 * const added = yield* watchAsset({
 *   type: 'ERC20',
 *   options: {
 *     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *     symbol: 'USDC',
 *     decimals: 6,
 *     image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
 *   }
 * });
 * console.log('Token added:', added);
 * ```
 *
 * @since 0.0.1
 */
export const watchAsset = (
	asset: WatchAssetParams,
): Effect.Effect<boolean, SignerError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		return yield* transport
			.request<boolean>("wallet_watchAsset", [
				{
					type: asset.type,
					options: {
						address: asset.options.address,
						symbol: asset.options.symbol,
						decimals: asset.options.decimals,
						image: asset.options.image,
					},
				},
			])
			.pipe(
				Effect.catchAll((e) => {
					const error = e as { code?: number; message?: unknown };
					const message =
						typeof error.message === "string"
							? error.message.toLowerCase()
							: undefined;
					if (error.code === 4001 || message?.includes("user rejected")) {
						return Effect.succeed(false);
					}
					return Effect.fail(
						new SignerError(
							{ action: "watchAsset", asset },
							`Failed to watch asset: ${String(error.message)}`,
							{ cause: e, code: error.code },
						),
					);
				}),
			);
	});
