/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Clone event log with deep copy of topics and data
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {T} Cloned log
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const cloned = EventLog.clone(log);
 * ```
 */
export function clone(log) {
	return {
		...log,
		topics: [...log.topics],
		data: new Uint8Array(log.data),
	};
}
