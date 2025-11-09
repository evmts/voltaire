/**
 * Clone event log with deep copy of arrays
 *
 * @template T
 * @param {T & import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {T}
 *
 * @example
 * ```typescript
 * import { clone } from './extensions'
 * const cloned = clone(log)
 * ```
 */
export function clone(log) {
	return {
		...log,
		topics: [...log.topics],
		data: new Uint8Array(log.data),
	};
}
