/**
 * @typedef {import('../../Hash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { getTopic0 } from "./getTopic0.js";

/**
 * Get event signature (alias for getTopic0)
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {BrandedHash | undefined} Event signature hash or undefined if no topics
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const sig1 = EventLog.getSignature(log);
 * const sig2 = log.getSignature();
 * ```
 */
export function getSignature(log) {
	return getTopic0(log);
}
