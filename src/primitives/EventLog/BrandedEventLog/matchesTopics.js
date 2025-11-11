/**
 * @typedef {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { hashEquals } from "./utils.js";

/**
 * Check if log matches topic filter
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {readonly (BrandedHash | BrandedHash[] | null)[]} filterTopics - Topic filter array
 * @returns {boolean} True if log matches topic filter
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const matches = EventLog.matchesTopics(log, [topic0, null, topic2]);
 * ```
 */
export function matchesTopics(log, filterTopics) {
	for (let i = 0; i < filterTopics.length; i++) {
		const filterTopic = filterTopics[i];
		if (filterTopic === null) {
			continue;
		}

		if (i >= log.topics.length) {
			return false;
		}

		const logTopic = log.topics[i];

		// Handle array of possible topics
		if (Array.isArray(filterTopic)) {
			let anyMatch = false;
			for (const possibleTopic of filterTopic) {
				if (
					logTopic !== undefined &&
					possibleTopic &&
					hashEquals(logTopic, possibleTopic)
				) {
					anyMatch = true;
					break;
				}
			}
			if (!anyMatch) {
				return false;
			}
		} else {
			// Single topic - must match exactly
			if (
				logTopic !== undefined &&
				filterTopic &&
				!hashEquals(logTopic, filterTopic)
			) {
				return false;
			}
		}
	}
	return true;
}
