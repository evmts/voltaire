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

// Import types
import type { EventLogConstructor } from "./EventLogConstructor.js";

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
 * Factory function for creating EventLog instances
 */
export const EventLog = ((params) => {
	return fromValue(params);
}) as EventLogConstructor;

// Initialize prototype
EventLog.prototype = {} as any;

// Attach static methods
EventLog.from = fromValue;
EventLog.create = create;
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
EventLog.prototype.getTopic0 = Function.prototype.call.bind(getTopic0) as any;
EventLog.prototype.getIndexedTopics = Function.prototype.call.bind(getIndexedTopics) as any;
EventLog.prototype.getSignature = Function.prototype.call.bind(getSignature) as any;
EventLog.prototype.getIndexed = Function.prototype.call.bind(getIndexed) as any;
EventLog.prototype.matchesTopics = Function.prototype.call.bind(matchesTopics) as any;
EventLog.prototype.matches = Function.prototype.call.bind(matchesTopics) as any;
EventLog.prototype.matchesAddress = Function.prototype.call.bind(matchesAddress) as any;
EventLog.prototype.matchesAddr = Function.prototype.call.bind(matchesAddress) as any;
EventLog.prototype.matchesFilter = Function.prototype.call.bind(matchesFilter) as any;
EventLog.prototype.matchesAll = Function.prototype.call.bind(matchesFilter) as any;
EventLog.prototype.isRemoved = Function.prototype.call.bind(isRemoved) as any;
EventLog.prototype.wasRemoved = Function.prototype.call.bind(wasRemoved) as any;
EventLog.prototype.clone = Function.prototype.call.bind(clone) as any;
EventLog.prototype.copy = Function.prototype.call.bind(copy) as any;
