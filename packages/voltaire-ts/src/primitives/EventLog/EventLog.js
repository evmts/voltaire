export * from "./EventLogConstructor.js";
export * from "./EventLogType.js";

import { clone } from "./clone.js";
import { copy } from "./copy.js";
import { create } from "./create.js";
import { filterLogs } from "./filterLogs.js";
import { from } from "./from.js";
import { fromRpc } from "./fromRpc.js";
import { getIndexed } from "./getIndexed.js";
import { getIndexedTopics } from "./getIndexedTopics.js";
import { getSignature } from "./getSignature.js";
import { getTopic0 } from "./getTopic0.js";
import { isRemoved } from "./isRemoved.js";
import { matchesAddress } from "./matchesAddress.js";
import { matchesFilter } from "./matchesFilter.js";
import { matchesTopics } from "./matchesTopics.js";
import { sortLogs } from "./sortLogs.js";
import { toRpc } from "./toRpc.js";
import { wasRemoved } from "./wasRemoved.js";

// Export individual functions
export {
	clone,
	copy,
	create,
	filterLogs,
	from,
	fromRpc,
	getIndexed,
	getIndexedTopics,
	getSignature,
	getTopic0,
	isRemoved,
	matchesAddress,
	matchesFilter,
	matchesTopics,
	sortLogs,
	toRpc,
	wasRemoved,
};

/**
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 * @typedef {import('./EventLogType.js').Filter} EventLogFilter
 * @typedef {import('./EventLogType.js').RpcLog} RpcLog
 * @typedef {import('../Address/AddressType.js').AddressType} BrandedAddress
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 * @typedef {readonly (HashType | HashType[] | null)[]} TopicFilter
 */

/**
 * Primary constructor for creating EventLog instances
 *
 * @param {Parameters<typeof from>[0]} params
 * @returns {ReturnType<typeof from>}
 * @example
 * const log = EventLog({
 *   address: Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'),
 *   topics: [Hash.fromHex('0xddf252ad...')],
 *   data: new Uint8Array([0, 0, 0, 1]),
 * });
 */
export function EventLog(params) {
	return from(params);
}

/**
 * Alias for EventLog() constructor
 *
 * @param {Parameters<typeof from>[0]} params
 * @returns {ReturnType<typeof from>}
 */
EventLog.from = (params) => from(params);
/**
 * @param {Parameters<typeof create>[0]} params
 */
EventLog.create = (params) => create(params);
/**
 * @param {RpcLog} rpcLog
 */
EventLog.fromRpc = (rpcLog) => fromRpc(rpcLog);
/**
 * @param {BrandedEventLog} log
 */
EventLog.toRpc = (log) => toRpc(log);

// Static methods - support both regular calls and .call(this) pattern
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.getTopic0 = function (log) {
	return getTopic0(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.getIndexedTopics = function (log) {
	return getIndexedTopics(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.getSignature = function (log) {
	return getSignature(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.getIndexed = function (log) {
	return getIndexed(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog | TopicFilter} log
 * @param {TopicFilter} [filterTopics]
 */
EventLog.matchesTopics = function (log, filterTopics) {
	if (filterTopics === undefined) {
		return matchesTopics(this, /** @type {TopicFilter} */ (log));
	}
	return matchesTopics(/** @type {BrandedEventLog} */ (log), filterTopics);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog | TopicFilter} log
 * @param {TopicFilter} [filterTopics]
 */
EventLog.matches = function (log, filterTopics) {
	if (filterTopics === undefined) {
		return matchesTopics(this, /** @type {TopicFilter} */ (log));
	}
	return matchesTopics(/** @type {BrandedEventLog} */ (log), filterTopics);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog | BrandedAddress | BrandedAddress[]} log
 * @param {BrandedAddress | BrandedAddress[]} [filterAddress]
 */
EventLog.matchesAddress = function (log, filterAddress) {
	if (filterAddress === undefined) {
		return matchesAddress(
			this,
			/** @type {BrandedAddress | BrandedAddress[]} */ (log),
		);
	}
	return matchesAddress(/** @type {BrandedEventLog} */ (log), filterAddress);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog | BrandedAddress | BrandedAddress[]} log
 * @param {BrandedAddress | BrandedAddress[]} [filterAddress]
 */
EventLog.matchesAddr = function (log, filterAddress) {
	if (filterAddress === undefined) {
		return matchesAddress(
			this,
			/** @type {BrandedAddress | BrandedAddress[]} */ (log),
		);
	}
	return matchesAddress(/** @type {BrandedEventLog} */ (log), filterAddress);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog | EventLogFilter} log
 * @param {EventLogFilter} [filter]
 */
EventLog.matchesFilter = function (log, filter) {
	if (filter === undefined) {
		return matchesFilter(this, /** @type {EventLogFilter} */ (log));
	}
	return matchesFilter(/** @type {BrandedEventLog} */ (log), filter);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog | EventLogFilter} log
 * @param {EventLogFilter} [filter]
 */
EventLog.matchesAll = function (log, filter) {
	if (filter === undefined) {
		return matchesFilter(this, /** @type {EventLogFilter} */ (log));
	}
	return matchesFilter(/** @type {BrandedEventLog} */ (log), filter);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.isRemoved = function (log) {
	return isRemoved(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.wasRemoved = function (log) {
	return wasRemoved(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.clone = function (log) {
	return clone(log ?? this);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedEventLog} [log]
 */
EventLog.copy = function (log) {
	return copy(log ?? this);
};
/**
 * @this {readonly BrandedEventLog[]}
 * @param {readonly BrandedEventLog[] | EventLogFilter} logs
 * @param {EventLogFilter} [filter]
 */
EventLog.filterLogs = function (logs, filter) {
	if (filter === undefined) {
		return filterLogs(this, /** @type {EventLogFilter} */ (logs));
	}
	return filterLogs(/** @type {readonly BrandedEventLog[]} */ (logs), filter);
};
/**
 * @this {readonly BrandedEventLog[]}
 * @param {readonly BrandedEventLog[]} [logs]
 */
EventLog.sortLogs = function (logs) {
	return sortLogs(logs ?? this);
};
/**
 * @this {readonly BrandedEventLog[]}
 * @param {readonly BrandedEventLog[]} [logs]
 */
EventLog.sort = function (logs) {
	return sortLogs(logs ?? this);
};

// Bind prototype methods - pass this as first argument
/** @this {BrandedEventLog} */
EventLog.prototype.getTopic0 = function () {
	return getTopic0(this);
};
/** @this {BrandedEventLog} */
EventLog.prototype.getIndexedTopics = function () {
	return getIndexedTopics(this);
};
/** @this {BrandedEventLog} */
EventLog.prototype.getSignature = function () {
	return getSignature(this);
};
/** @this {BrandedEventLog} */
EventLog.prototype.getIndexed = function () {
	return getIndexed(this);
};
/**
 * @this {BrandedEventLog}
 * @param {TopicFilter} filterTopics
 */
EventLog.prototype.matchesTopics = function (filterTopics) {
	return matchesTopics(this, filterTopics);
};
/**
 * @this {BrandedEventLog}
 * @param {TopicFilter} filterTopics
 */
EventLog.prototype.matches = function (filterTopics) {
	return matchesTopics(this, filterTopics);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedAddress | BrandedAddress[]} filterAddress
 */
EventLog.prototype.matchesAddress = function (filterAddress) {
	return matchesAddress(this, filterAddress);
};
/**
 * @this {BrandedEventLog}
 * @param {BrandedAddress | BrandedAddress[]} filterAddress
 */
EventLog.prototype.matchesAddr = function (filterAddress) {
	return matchesAddress(this, filterAddress);
};
/**
 * @this {BrandedEventLog}
 * @param {EventLogFilter} filter
 */
EventLog.prototype.matchesFilter = function (filter) {
	return matchesFilter(this, filter);
};
/**
 * @this {BrandedEventLog}
 * @param {EventLogFilter} filter
 */
EventLog.prototype.matchesAll = function (filter) {
	return matchesFilter(this, filter);
};
/** @this {BrandedEventLog} */
EventLog.prototype.isRemoved = function () {
	return isRemoved(this);
};
/** @this {BrandedEventLog} */
EventLog.prototype.wasRemoved = function () {
	return wasRemoved(this);
};
/** @this {BrandedEventLog} */
EventLog.prototype.clone = function () {
	return clone(this);
};
/** @this {BrandedEventLog} */
EventLog.prototype.copy = function () {
	return copy(this);
};
