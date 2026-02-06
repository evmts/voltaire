/**
 * Get topic0 (event signature) from log
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log - Event log
 * @returns {import('../../Hash/HashType.js').HashType | undefined}
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
