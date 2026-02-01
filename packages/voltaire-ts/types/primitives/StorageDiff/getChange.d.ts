/**
 * Get change for a specific storage slot
 *
 * @param {import('./StorageDiffType.js').StorageDiffType} diff - Storage diff
 * @param {import('../State/StorageKeyType.js').StorageKeyType} key - Storage key to look up
 * @returns {import('./StorageDiffType.js').StorageChange | undefined} Storage change or undefined
 *
 * @example
 * ```typescript
 * const change = StorageDiff.getChange(diff, storageKey);
 * if (change) {
 *   console.log(`${change.from} -> ${change.to}`);
 * }
 * ```
 */
export function getChange(diff: import("./StorageDiffType.js").StorageDiffType, key: import("../State/StorageKeyType.js").StorageKeyType): import("./StorageDiffType.js").StorageChange | undefined;
//# sourceMappingURL=getChange.d.ts.map