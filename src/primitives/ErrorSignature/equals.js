/**
 * Check if two ErrorSignatures are equal
 *
 * @param {import('./ErrorSignatureType.js').ErrorSignatureType} a - First signature
 * @param {import('./ErrorSignatureType.js').ErrorSignatureType} b - Second signature
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const equal = ErrorSignature.equals(sig1, sig2);
 * ```
 */
export function equals(a, b) {
	return a.length === b.length && a.every((byte, index) => byte === b[index]);
}
