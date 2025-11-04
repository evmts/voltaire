import type { BrandedEventLog } from "./BrandedEventLog.js";
import { isRemoved } from "./isRemoved.js";

/**
 * Check if log was removed (alias for isRemoved)
 *
 * @param log Event log
 * @returns True if log was removed
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const removed1 = EventLog.wasRemoved(log);
 * const removed2 = log.wasRemoved();
 * ```
 */
export function wasRemoved<T extends BrandedEventLog>(log: T): boolean {
	return isRemoved(log);
}
