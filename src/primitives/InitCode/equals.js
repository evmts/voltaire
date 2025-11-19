/**
 * Check if two InitCode instances are equal
 *
 * @param {import('./InitCodeType.js').InitCodeType} a - First InitCode
 * @param {import('./InitCodeType.js').InitCodeType} b - Second InitCode
 * @returns {boolean} true if equal
 * @example
 * ```javascript
 * import * as InitCode from './primitives/InitCode/index.js';
 * const code1 = InitCode.from("0x6001");
 * const code2 = InitCode.from("0x6001");
 * InitCode._equals(code1, code2); // true
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
