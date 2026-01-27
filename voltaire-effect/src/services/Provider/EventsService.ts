/**
 * @fileoverview Events service definition for log/filter JSON-RPC calls.
 *
 * @module EventsService
 * @since 0.3.0
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	CreateBlockFilterError,
	CreateEventFilterError,
	CreatePendingTransactionFilterError,
	EventFilter,
	FilterChanges,
	FilterId,
	GetFilterChangesError,
	GetFilterLogsError,
	GetLogsError,
	LogFilter,
	LogType,
	UninstallFilterError,
} from "./ProviderService.js";

/**
 * Shape of the Events service.
 *
 * @since 0.3.0
 */
export type EventsShape = {
	/** Gets logs matching the filter */
	readonly getLogs: (filter: LogFilter) => Effect.Effect<LogType[], GetLogsError>;
	/** Creates an event filter (eth_newFilter) */
	readonly createEventFilter: (
		filter?: EventFilter,
	) => Effect.Effect<FilterId, CreateEventFilterError>;
	/** Creates a new block filter (eth_newBlockFilter) */
	readonly createBlockFilter: () => Effect.Effect<FilterId, CreateBlockFilterError>;
	/** Creates a pending transaction filter (eth_newPendingTransactionFilter) */
	readonly createPendingTransactionFilter: () => Effect.Effect<
		FilterId,
		CreatePendingTransactionFilterError
	>;
	/** Gets changes since last poll for a filter (eth_getFilterChanges) */
	readonly getFilterChanges: (
		filterId: FilterId,
	) => Effect.Effect<FilterChanges, GetFilterChangesError>;
	/** Gets all logs for a filter (eth_getFilterLogs) */
	readonly getFilterLogs: (
		filterId: FilterId,
	) => Effect.Effect<LogType[], GetFilterLogsError>;
	/** Uninstalls a filter (eth_uninstallFilter) */
	readonly uninstallFilter: (
		filterId: FilterId,
	) => Effect.Effect<boolean, UninstallFilterError>;
};

/**
 * Events service for log and filter JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class EventsService extends Context.Tag("EventsService")<
	EventsService,
	EventsShape
>() {}
