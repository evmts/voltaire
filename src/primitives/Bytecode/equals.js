/**
 * Compare two bytecode arrays for equality
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} a - First bytecode
 * @param {import('./BrandedBytecode.js').BrandedBytecode} b - Second bytecode
 * @returns {boolean} true if bytecode is identical
 *
 * @example
 * ```typescript
 * const code1 = new Uint8Array([0x60, 0x01]);
 * const code2 = new Uint8Array([0x60, 0x01]);
 * Bytecode.equals(code1, code2); // true
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
