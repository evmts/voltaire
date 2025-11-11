import { isRemoved } from "./isRemoved.js";

/**
 * Check if log was removed (alias for isRemoved)
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {boolean}
 *
 * @example
 * import { wasRemoved } from './extensions'
 * if (wasRemoved(log)) console.log('reorg detected')
 */
export function wasRemoved(log) {
	return isRemoved(log);
}
