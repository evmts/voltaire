import { getTopic0 } from "./getTopic0.js";

/**
 * Get event signature (alias for getTopic0)
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log - Event log
 * @returns {import('../../Hash/HashType/HashType.js').HashType | undefined}
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
