/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Check if log was removed
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {boolean} True if log was removed
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const removed1 = EventLog.isRemoved(log);
 * const removed2 = log.isRemoved();
 * ```
 */
export function isRemoved(log) {
	return log.removed === true;
}
