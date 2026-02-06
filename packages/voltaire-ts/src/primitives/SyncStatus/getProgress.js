/**
 * Calculate sync progress as percentage
 *
 * @param {import('./SyncStatusType.js').SyncStatusType} status - Sync status
 * @returns {number} Progress percentage (0-100), or 100 if not syncing
 * @throws {Error} If status is syncing but has invalid block numbers
 *
 * @example
 * ```typescript
 * const progress = SyncStatus.getProgress(status);
 * console.log(`Syncing: ${progress.toFixed(2)}%`);
 * ```
 */
export function getProgress(status) {
	if (status === false) {
		return 100;
	}

	const total = status.highestBlock - status.startingBlock;
	if (total === 0n) {
		return 100;
	}

	const current = status.currentBlock - status.startingBlock;
	const progress = (Number(current) / Number(total)) * 100;

	// Clamp to 0-100
	return Math.max(0, Math.min(100, progress));
}
