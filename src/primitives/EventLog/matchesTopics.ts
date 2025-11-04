import type { Hash } from "../Hash/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";
import { hashEquals } from "./utils.js";

/**
 * Check if log matches topic filter
 *
 * @param log Event log to check
 * @param filterTopics Topic filter array
 * @returns True if log matches topic filter
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const matches1 = EventLog.matchesTopics(log, [topic0, null, topic2]);
 * const matches2 = log.matchesTopics([topic0, null, topic2]);
 * ```
 */
export function matchesTopics<T extends BrandedEventLog>(
	log: T,
	filterTopics: readonly (Hash | Hash[] | null)[],
): boolean {
	for (let i = 0; i < filterTopics.length; i++) {
		const filterTopic = filterTopics[i];
		if (filterTopic === null) {
			continue;
		}

		if (i >= log.topics.length) {
			return false;
		}

		const logTopic = log.topics[i]!;

		// Handle array of possible topics
		if (Array.isArray(filterTopic)) {
			let anyMatch = false;
			for (const possibleTopic of filterTopic as Hash[]) {
				if (hashEquals(logTopic, possibleTopic)) {
					anyMatch = true;
					break;
				}
			}
			if (!anyMatch) {
				return false;
			}
		} else {
			// Single topic - must match exactly
			if (!hashEquals(logTopic, filterTopic as Hash)) {
				return false;
			}
		}
	}
	return true;
}
