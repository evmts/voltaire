import { Hash, type BrandedHash } from "../Hash/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";
import { getIndexedTopics } from "./getIndexedTopics.js";

/**
 * Get indexed parameters (alias for getIndexedTopics)
 *
 * @param log Event log
 * @returns Array of indexed topic hashes
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const indexed1 = EventLog.getIndexed(log);
 * const indexed2 = log.getIndexed();
 * ```
 */
export function getIndexed<T extends BrandedEventLog>(log: T): readonly Hash[] {
	return getIndexedTopics(log);
}
