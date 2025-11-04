import type { BrandedEventLog } from "./BrandedEventLog.js";

/**
 * Sort logs by block number and log index
 *
 * @param logs Array of event logs
 * @returns Sorted array of logs
 *
 * @example
 * ```typescript
 * const logs = [log3, log1, log2];
 * const sorted = EventLog.sortLogs(logs);
 * ```
 */
export function sortLogs<T extends BrandedEventLog>(logs: readonly T[]): T[] {
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
