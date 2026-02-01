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
export function getKeys(diff: import("./StorageDiffType.js").StorageDiffType): Array<import("../State/StorageKeyType.js").StorageKeyType>;
//# sourceMappingURL=getKeys.d.ts.map