import { hashEquals } from "./utils.js";
/**
 * Check if log matches topic filter
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log
 * @param {readonly (import('../../Hash/HashType.js').HashType | import('../../Hash/HashType.js').HashType[] | null)[]} filterTopics
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { matchesTopics } from './extensions'
 * const matches = matchesTopics(log, [topic0, null, topic2])
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex matching logic
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
                if (logTopic !== undefined &&
                    possibleTopic &&
                    hashEquals(logTopic, possibleTopic)) {
                    anyMatch = true;
                    break;
                }
            }
            if (!anyMatch) {
                return false;
            }
        }
        else {
            // Single topic - must match exactly
            if (logTopic !== undefined &&
                filterTopic &&
                !hashEquals(logTopic, filterTopic)) {
                return false;
            }
        }
    }
    return true;
}
