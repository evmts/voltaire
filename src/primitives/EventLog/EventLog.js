/**
 * EventLog (Ethereum Event Log) Types and Utilities
 *
 * Complete event log handling with filtering and matching operations.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { EventLog } from './EventLog.js';
 *
 * // Factory function
 * const log = EventLog({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 *
 * // Static methods
 * const topic0 = EventLog.getTopic0(log);
 * const matches = EventLog.matchesFilter(log, { address: "0x..." });
 *
 * // Instance methods
 * const topic0_2 = log.getTopic0();
 * const matches2 = log.matchesFilter({ address: "0x..." });
 * ```
 */

// Import all method functions
import { clone } from "./clone.js";
import { copy } from "./copy.js";
import { create } from "./create.js";
import { filterLogs } from "./filterLogs.js";
import { from as fromValue } from "./from.js";
import { getIndexed } from "./getIndexed.js";
import { getIndexedTopics } from "./getIndexedTopics.js";
import { getSignature } from "./getSignature.js";
import { getTopic0 } from "./getTopic0.js";
import { isRemoved } from "./isRemoved.js";
import { matchesAddress } from "./matchesAddress.js";
import { matchesFilter } from "./matchesFilter.js";
import { matchesTopics } from "./matchesTopics.js";
import { sortLogs } from "./sortLogs.js";
import { wasRemoved } from "./wasRemoved.js";

// Re-export types
export * from "./BrandedEventLog.js";

// Re-export method functions for tree-shaking
export {
	clone,
	copy,
	create,
	filterLogs,
	fromValue as from,
	getIndexed,
	getIndexedTopics,
	getSignature,
	getTopic0,
	isRemoved,
	matchesAddress,
	matchesFilter,
	matchesTopics,
	sortLogs,
	wasRemoved,
};

/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 * @typedef {import('./EventLogConstructor.js').EventLogConstructor} EventLogConstructor
 */

/**
 * Factory function for creating EventLog instances
 *
 * @type {EventLogConstructor}
 */
export function EventLog(params) {
	return fromValue(params);
}

// Attach static methods - wrapped to set prototype without mutating originals
EventLog.from = function (value) {
	return fromValue(value);
};
EventLog.from.prototype = EventLog.prototype;

EventLog.create = function (params) {
	return create(params);
};
EventLog.create.prototype = EventLog.prototype;
EventLog.getTopic0 = getTopic0;
EventLog.getIndexedTopics = getIndexedTopics;
EventLog.getSignature = getSignature;
EventLog.getIndexed = getIndexed;
EventLog.matchesTopics = matchesTopics;
EventLog.matches = matchesTopics;
EventLog.matchesAddress = matchesAddress;
EventLog.matchesAddr = matchesAddress;
EventLog.matchesFilter = matchesFilter;
EventLog.matchesAll = matchesFilter;
EventLog.isRemoved = isRemoved;
EventLog.wasRemoved = wasRemoved;
EventLog.clone = clone;
EventLog.copy = copy;
EventLog.filterLogs = filterLogs;
EventLog.filter = filterLogs;
EventLog.sortLogs = sortLogs;
EventLog.sort = sortLogs;

// Bind prototype methods using Function.prototype.call.bind
EventLog.prototype.getTopic0 = Function.prototype.call.bind(getTopic0);
EventLog.prototype.getIndexedTopics = Function.prototype.call.bind(getIndexedTopics);
EventLog.prototype.getSignature = Function.prototype.call.bind(getSignature);
EventLog.prototype.getIndexed = Function.prototype.call.bind(getIndexed);
EventLog.prototype.matchesTopics = Function.prototype.call.bind(matchesTopics);
EventLog.prototype.matches = Function.prototype.call.bind(matchesTopics);
EventLog.prototype.matchesAddress = Function.prototype.call.bind(matchesAddress);
EventLog.prototype.matchesAddr = Function.prototype.call.bind(matchesAddress);
EventLog.prototype.matchesFilter = Function.prototype.call.bind(matchesFilter);
EventLog.prototype.matchesAll = Function.prototype.call.bind(matchesFilter);
EventLog.prototype.isRemoved = Function.prototype.call.bind(isRemoved);
EventLog.prototype.wasRemoved = Function.prototype.call.bind(wasRemoved);
EventLog.prototype.clone = Function.prototype.call.bind(clone);
EventLog.prototype.copy = Function.prototype.call.bind(copy);
