/**
 * @fileoverview Live implementation of TransactionService using ProviderService.
 *
 * @module Transaction
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "./ProviderService.js";
import { TransactionService } from "./TransactionService.js";

/**
 * Live implementation of the Transaction layer.
 *
 * @since 0.3.0
 */
export const Transaction: Layer.Layer<
	TransactionService,
	never,
	ProviderService
> = Layer.effect(
	TransactionService,
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return {
			getTransaction: provider.getTransaction,
			getTransactionReceipt: provider.getTransactionReceipt,
			getTransactionByBlockHashAndIndex:
				provider.getTransactionByBlockHashAndIndex,
			getTransactionByBlockNumberAndIndex:
				provider.getTransactionByBlockNumberAndIndex,
			sendRawTransaction: provider.sendRawTransaction,
			sendTransaction: provider.sendTransaction,
			waitForTransactionReceipt: provider.waitForTransactionReceipt,
			getTransactionConfirmations: provider.getTransactionConfirmations,
		};
	}),
);
