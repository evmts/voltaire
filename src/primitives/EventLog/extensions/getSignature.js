import { getTopic0 } from "./getTopic0.js";

/**
 * Get event signature (alias for getTopic0)
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash | undefined}
 *
 * @example
 * ```typescript
 * import { getSignature } from './extensions'
 * const sig = getSignature(log)
 * ```
 */
export function getSignature(log) {
	return getTopic0(log);
}
