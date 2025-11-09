/**
 * Check if log was removed due to chain reorganization
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { isRemoved } from './extensions'
 * if (isRemoved(log)) { /* reorg detected */ }
 * ```
 */
export function isRemoved(log) {
	return log.removed === true;
}
