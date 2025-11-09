/**
 * Get topic0 (event signature) from log
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash | undefined}
 *
 * @example
 * ```typescript
 * import { getTopic0 } from './extensions'
 * const sig = getTopic0(log)
 * ```
 */
export function getTopic0(log) {
	return log.topics[0];
}
