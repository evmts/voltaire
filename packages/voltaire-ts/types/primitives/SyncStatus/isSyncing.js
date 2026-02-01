/**
 * Check if node is actively syncing
 *
 * @param {import('./SyncStatusType.js').SyncStatusType} status - Sync status
 * @returns {boolean} True if syncing
 *
 * @example
 * ```typescript
 * if (SyncStatus.isSyncing(status)) {
 *   console.log("Node is syncing");
 * } else {
 *   console.log("Node is synced");
 * }
 * ```
 */
export function isSyncing(status) {
    return status !== false;
}
