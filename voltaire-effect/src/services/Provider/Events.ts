/**
 * @fileoverview Live implementation of EventsService using ProviderService.
 *
 * @module Events
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { EventsService } from "./EventsService.js";
import { ProviderService } from "./ProviderService.js";

/**
 * Live implementation of the Events layer.
 *
 * @since 0.3.0
 */
export const Events: Layer.Layer<EventsService, never, ProviderService> =
	Layer.effect(
		EventsService,
		Effect.gen(function* () {
			const provider = yield* ProviderService;
			return {
				getLogs: provider.getLogs,
				createEventFilter: provider.createEventFilter,
				createBlockFilter: provider.createBlockFilter,
				createPendingTransactionFilter: provider.createPendingTransactionFilter,
				getFilterChanges: provider.getFilterChanges,
				getFilterLogs: provider.getFilterLogs,
				uninstallFilter: provider.uninstallFilter,
			};
		}),
	);
