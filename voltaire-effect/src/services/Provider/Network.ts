/**
 * @fileoverview Live implementation of NetworkService using ProviderService.
 *
 * @module Network
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { NetworkService } from "./NetworkService.js";
import { ProviderService } from "./ProviderService.js";

/**
 * Live implementation of the Network layer.
 *
 * @since 0.3.0
 */
export const Network: Layer.Layer<NetworkService, never, ProviderService> =
	Layer.effect(
		NetworkService,
		Effect.gen(function* () {
			const provider = yield* ProviderService;
			return {
				getChainId: provider.getChainId,
				getGasPrice: provider.getGasPrice,
				getMaxPriorityFeePerGas: provider.getMaxPriorityFeePerGas,
				getFeeHistory: provider.getFeeHistory,
				getBlobBaseFee: provider.getBlobBaseFee,
				getSyncing: provider.getSyncing,
				getAccounts: provider.getAccounts,
				getCoinbase: provider.getCoinbase,
				netVersion: provider.netVersion,
				getProtocolVersion: provider.getProtocolVersion,
				getMining: provider.getMining,
				getHashrate: provider.getHashrate,
				getWork: provider.getWork,
				submitWork: provider.submitWork,
				submitHashrate: provider.submitHashrate,
			};
		}),
	);
