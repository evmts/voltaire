import type { BrandedEventLog } from "./BrandedEventLog.js";

/**
 * Check if log was removed
 *
 * @param log Event log
 * @returns True if log was removed
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const removed1 = EventLog.isRemoved(log);
 * const removed2 = log.isRemoved();
 * ```
 */
export function isRemoved<T extends BrandedEventLog>(log: T): boolean {
	return log.removed === true;
}
