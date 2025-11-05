/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { isRemoved } from "./isRemoved.js";

/**
 * Check if log was removed (alias for isRemoved)
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {boolean} True if log was removed
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const removed1 = EventLog.wasRemoved(log);
 * const removed2 = log.wasRemoved();
 * ```
 */
export function wasRemoved(log) {
	return isRemoved(log);
}
