import type { Hash } from "../Hash/index.js";
import type { Data } from "./EventLog.js";
import { hashEquals } from "./utils.js";

/**
 * Check if log matches topic filter (standard form)
 */
export function matchesTopics<T extends Data>(
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
