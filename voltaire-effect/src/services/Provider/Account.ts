/**
 * @fileoverview Live implementation of AccountService using ProviderService.
 *
 * @module Account
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { AccountService } from "./AccountService.js";
import { ProviderService } from "./ProviderService.js";

/**
 * Live implementation of the Account layer.
 *
 * @since 0.3.0
 */
export const Account: Layer.Layer<AccountService, never, ProviderService> =
	Layer.effect(
		AccountService,
		Effect.gen(function* () {
			const provider = yield* ProviderService;
			return {
				getBalance: provider.getBalance,
				getTransactionCount: provider.getTransactionCount,
				getCode: provider.getCode,
				getStorageAt: provider.getStorageAt,
				getProof: provider.getProof,
				sign: provider.sign,
				signTransaction: provider.signTransaction,
			};
		}),
	);
