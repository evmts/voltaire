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
export function getProgress(status: import("./SyncStatusType.js").SyncStatusType): number;
//# sourceMappingURL=getProgress.d.ts.map