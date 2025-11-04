import { Hash, type BrandedHash } from "../Hash/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";

/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @param log Event log
 * @returns Array of indexed topic hashes
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const indexed1 = EventLog.getIndexedTopics(log);
 * const indexed2 = log.getIndexedTopics();
 * ```
 */
export function getIndexedTopics<T extends BrandedEventLog>(log: T): readonly Hash[] {
	return log.topics.slice(1);
}
