/**
 * Check if state diff has any changes
 *
 * @param {import('./StateDiffType.js').StateDiffType} diff - State diff
 * @returns {boolean} True if no accounts have changes
 *
 * @example
 * ```typescript
 * if (!StateDiff.isEmpty(diff)) {
 *   console.log("State was modified");
 * }
 * ```
 */
export function isEmpty(diff) {
	return diff.accounts.size === 0;
}
