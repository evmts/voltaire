// @ts-nocheck
export * from "./BrandedEventLog.js";
export * from "./EventLogConstructor.js";

import { clone } from "./clone.js";
import { copy } from "./copy.js";
import { create } from "./create.js";
import { filterLogs } from "./filterLogs.js";
import { from } from "./from.js";
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

// Export individual functions
export {
	clone,
	copy,
	create,
	filterLogs,
	from,
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
	return from(params);
}

EventLog.from = (params) => from(params);
EventLog.from.prototype = EventLog.prototype;
EventLog.create = (params) => create(params);
EventLog.create.prototype = EventLog.prototype;

// Static methods - support both regular calls and .call(this) pattern
EventLog.getTopic0 = function (log) {
	return getTopic0(log ?? this);
};
EventLog.getIndexedTopics = function (log) {
	return getIndexedTopics(log ?? this);
};
EventLog.getSignature = function (log) {
	return getSignature(log ?? this);
};
EventLog.getIndexed = function (log) {
	return getIndexed(log ?? this);
};
EventLog.matchesTopics = function (log, filterTopics) {
	if (filterTopics === undefined) return matchesTopics(this, log);
	return matchesTopics(log, filterTopics);
};
EventLog.matches = function (log, filterTopics) {
	if (filterTopics === undefined) return matchesTopics(this, log);
	return matchesTopics(log, filterTopics);
};
EventLog.matchesAddress = function (log, filterAddress) {
	if (filterAddress === undefined) return matchesAddress(this, log);
	return matchesAddress(log, filterAddress);
};
EventLog.matchesAddr = function (log, filterAddress) {
	if (filterAddress === undefined) return matchesAddress(this, log);
	return matchesAddress(log, filterAddress);
};
EventLog.matchesFilter = function (log, filter) {
	if (filter === undefined) return matchesFilter(this, log);
	return matchesFilter(log, filter);
};
EventLog.matchesAll = function (log, filter) {
	if (filter === undefined) return matchesFilter(this, log);
	return matchesFilter(log, filter);
};
EventLog.isRemoved = function (log) {
	return isRemoved(log ?? this);
};
EventLog.wasRemoved = function (log) {
	return wasRemoved(log ?? this);
};
EventLog.clone = function (log) {
	return clone(log ?? this);
};
EventLog.copy = function (log) {
	return copy(log ?? this);
};
EventLog.filterLogs = function (logs, filter) {
	if (filter === undefined) return filterLogs(this, logs);
	return filterLogs(logs, filter);
};
EventLog.filter = function (logs, filter) {
	if (filter === undefined) return filterLogs(this, logs);
	return filterLogs(logs, filter);
};
EventLog.sortLogs = function (logs) {
	return sortLogs(logs ?? this);
};
EventLog.sort = function (logs) {
	return sortLogs(logs ?? this);
};

// Bind prototype methods - pass this as first argument
EventLog.prototype.getTopic0 = function () {
	return getTopic0(this);
};
EventLog.prototype.getIndexedTopics = function () {
	return getIndexedTopics(this);
};
EventLog.prototype.getSignature = function () {
	return getSignature(this);
};
EventLog.prototype.getIndexed = function () {
	return getIndexed(this);
};
EventLog.prototype.matchesTopics = function (filterTopics) {
	return matchesTopics(this, filterTopics);
};
EventLog.prototype.matches = function (filterTopics) {
	return matchesTopics(this, filterTopics);
};
EventLog.prototype.matchesAddress = function (filterAddress) {
	return matchesAddress(this, filterAddress);
};
EventLog.prototype.matchesAddr = function (filterAddress) {
	return matchesAddress(this, filterAddress);
};
EventLog.prototype.matchesFilter = function (filter) {
	return matchesFilter(this, filter);
};
EventLog.prototype.matchesAll = function (filter) {
	return matchesFilter(this, filter);
};
EventLog.prototype.isRemoved = function () {
	return isRemoved(this);
};
EventLog.prototype.wasRemoved = function () {
	return wasRemoved(this);
};
EventLog.prototype.clone = function () {
	return clone(this);
};
EventLog.prototype.copy = function () {
	return copy(this);
};
