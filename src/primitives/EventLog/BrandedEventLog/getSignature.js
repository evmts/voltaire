/**
 * @typedef {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { getTopic0 } from "./getTopic0.js";

/**
 * Get event signature (alias for getTopic0)
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {BrandedHash | undefined} Event signature hash or undefined if no topics
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const sig = EventLog.getSignature(log);
 * ```
 */
export function getSignature(log) {
	return getTopic0(log);
}
