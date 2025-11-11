/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { clone } from "./clone.js";

/**
 * Copy event log (alias for clone)
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {T} Copied log
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const copied = EventLog.copy(log);
 * ```
 */
export function copy(log) {
	return clone(log);
}
