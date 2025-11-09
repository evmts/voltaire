import { clone } from "./clone.js";

/**
 * Copy event log (alias for clone)
 *
 * @template T
 * @param {T & import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {T}
 *
 * @example
 * ```typescript
 * import { copy } from './extensions'
 * const copied = copy(log)
 * ```
 */
export function copy(log) {
	return clone(log);
}
