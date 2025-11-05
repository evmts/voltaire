/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Sort logs by block number and log index
 *
 * @template {BrandedEventLog} T
 * @param {readonly T[]} logs - Array of event logs
 * @returns {T[]} Sorted array of logs
 *
 * @example
 * ```typescript
 * const logs = [log3, log1, log2];
 * const sorted = EventLog.sortLogs(logs);
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
