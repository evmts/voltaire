/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Clone event log with deep copy of topics and data
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {T} Cloned log
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const cloned1 = EventLog.clone(log);
 * const cloned2 = log.clone();
 * ```
 */
export function clone(log) {
	return {
		...log,
		topics: [...log.topics],
		data: new Uint8Array(log.data),
	};
}
