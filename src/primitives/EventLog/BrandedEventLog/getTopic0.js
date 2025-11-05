/**
 * @typedef {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Get topic0 (event signature) from log
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {BrandedHash | undefined} Topic0 hash or undefined if no topics
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const topic0_1 = EventLog.getTopic0(log);
 * const topic0_2 = log.getTopic0();
 * ```
 */
export function getTopic0(log) {
	return log.topics[0];
}
