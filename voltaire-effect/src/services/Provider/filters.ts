/**
 * @fileoverview Filter-based subscription helpers for ProviderService.
 *
 * @module Provider/filters
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import {
	ProviderService,
	type EventFilter,
	type FilterChanges,
	type FilterId,
	type LogType,
	type ProviderError,
} from "./ProviderService.js";

/**
 * Creates an event log filter via eth_newFilter.
 */
export const createEventFilter = (
	filter?: EventFilter,
): Effect.Effect<FilterId, ProviderError, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return yield* provider.createEventFilter(filter);
	});

/**
 * Creates a new block filter via eth_newBlockFilter.
 */
export const createBlockFilter = (): Effect.Effect<
	FilterId,
	ProviderError,
	ProviderService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return yield* provider.createBlockFilter();
	});

/**
 * Creates a pending transaction filter via eth_newPendingTransactionFilter.
 */
export const createPendingTransactionFilter = (): Effect.Effect<
	FilterId,
	ProviderError,
	ProviderService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return yield* provider.createPendingTransactionFilter();
	});

/**
 * Gets changes since last poll for a filter via eth_getFilterChanges.
 */
export const getFilterChanges = (
	filterId: FilterId,
): Effect.Effect<FilterChanges, ProviderError, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return yield* provider.getFilterChanges(filterId);
	});

/**
 * Gets all logs for a filter via eth_getFilterLogs.
 */
export const getFilterLogs = (
	filterId: FilterId,
): Effect.Effect<LogType[], ProviderError, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return yield* provider.getFilterLogs(filterId);
	});

/**
 * Uninstalls a filter via eth_uninstallFilter.
 */
export const uninstallFilter = (
	filterId: FilterId,
): Effect.Effect<boolean, ProviderError, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return yield* provider.uninstallFilter(filterId);
	});
