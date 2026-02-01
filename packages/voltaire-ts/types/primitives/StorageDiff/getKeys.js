/**
 * Get all storage keys that changed
 *
 * @param {import('./StorageDiffType.js').StorageDiffType} diff - Storage diff
 * @returns {Array<import('../State/StorageKeyType.js').StorageKeyType>} Array of storage keys
 *
 * @example
 * ```typescript
 * const keys = StorageDiff.getKeys(diff);
 * for (const key of keys) {
 *   console.log(`Slot ${key.slot} changed`);
 * }
 * ```
 */
export function getKeys(diff) {
    return Array.from(diff.changes.keys());
}
