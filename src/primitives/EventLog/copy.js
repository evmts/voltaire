/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { clone } from "./clone.js";

/**
 * Copy event log (alias for clone)
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {T} Copied log
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const copied1 = EventLog.copy(log);
 * const copied2 = log.copy();
 * ```
 */
export function copy(log) {
	return clone(log);
}
