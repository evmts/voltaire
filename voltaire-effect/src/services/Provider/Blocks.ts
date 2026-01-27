/**
 * @fileoverview Live implementation of BlocksService using ProviderService.
 *
 * @module Blocks
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { BlocksService } from "./BlocksService.js";
import { ProviderService } from "./ProviderService.js";

/**
 * Live implementation of the Blocks layer.
 *
 * @since 0.3.0
 */
export const Blocks: Layer.Layer<BlocksService, never, ProviderService> =
	Layer.effect(
		BlocksService,
		Effect.gen(function* () {
			const provider = yield* ProviderService;
			return {
				getBlockNumber: provider.getBlockNumber,
				getBlock: provider.getBlock,
				getBlockTransactionCount: provider.getBlockTransactionCount,
				getBlockReceipts: provider.getBlockReceipts,
				getUncle: provider.getUncle,
				getUncleCount: provider.getUncleCount,
			};
		}),
	);
