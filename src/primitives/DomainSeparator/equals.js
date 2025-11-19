/**
 * Check if two DomainSeparators are equal
 *
 * @param {import('./DomainSeparatorType.js').DomainSeparatorType} a - First DomainSeparator
 * @param {import('./DomainSeparatorType.js').DomainSeparatorType} b - Second DomainSeparator
 * @returns {boolean} True if equal
 * @example
 * ```javascript
 * const equal = DomainSeparator.equals(sep1, sep2);
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
