/**
 * Sort logs by block number and log index
 *
 * @template T
 * @param {readonly (T & import('../EventLogType.js').BrandedEventLog)[]} logs
 * @returns {(T & import('../EventLogType.js').BrandedEventLog)[]}
 *
 * @example
 * ```typescript
 * import { sortLogs } from './extensions'
 * const sorted = sortLogs(logs)
 * ```
 */
export function sortLogs(logs) {
    return [...logs].sort((a, b) => {
        const blockA = a.blockNumber ?? 0n;
        const blockB = b.blockNumber ?? 0n;
        if (blockA !== blockB) {
            return blockA < blockB ? -1 : 1;
        }
        const indexA = a.logIndex ?? 0;
        const indexB = b.logIndex ?? 0;
        return indexA - indexB;
    });
}
