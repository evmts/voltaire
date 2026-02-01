/**
 * Get number of storage slots that changed
 *
 * @param {import('./StorageDiffType.js').StorageDiffType} diff - Storage diff
 * @returns {number} Number of changed slots
 *
 * @example
 * ```typescript
 * const count = StorageDiff.size(diff);
 * console.log(`${count} storage slots changed`);
 * ```
 */
export function size(diff) {
	return diff.changes.size;
}
