/**
 * Compare two ProtocolVersions for ordering
 * Returns negative if this < other, positive if this > other, 0 if equal
 *
 * Only compares versions within the same protocol family (e.g., eth/66 vs eth/67)
 * Returns 0 for different protocols
 *
 * @this {import('./ProtocolVersionType.js').ProtocolVersionType}
 * @param {import('./ProtocolVersionType.js').ProtocolVersionType} other - Protocol version to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 *
 * @example
 * ```javascript
 * import * as ProtocolVersion from './primitives/ProtocolVersion/index.js';
 * const v66 = ProtocolVersion.from("eth/66");
 * const v67 = ProtocolVersion.from("eth/67");
 * const result = ProtocolVersion._compare.call(v66, v67); // -1
 * ```
 */
export function compare(other) {
	const thisParts = this.split("/");
	const otherParts = other.split("/");

	// Different protocols - return 0 (not comparable)
	if (thisParts[0] !== otherParts[0]) {
		return 0;
	}

	// Compare version numbers
	const thisVersion = Number.parseInt(thisParts[1] || "0", 10);
	const otherVersion = Number.parseInt(otherParts[1] || "0", 10);

	if (thisVersion < otherVersion) return -1;
	if (thisVersion > otherVersion) return 1;
	return 0;
}
