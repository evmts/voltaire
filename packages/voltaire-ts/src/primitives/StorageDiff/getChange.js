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
export function getChange(diff, key) {
	// Need to find matching key since Map uses reference equality
	for (const [k, v] of diff.changes.entries()) {
		if (k.address === key.address && k.slot === key.slot) {
			return v;
		}
	}
	return undefined;
}
