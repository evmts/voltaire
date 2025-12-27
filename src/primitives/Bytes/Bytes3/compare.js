/**
 * @param {import('./Bytes3Type.js').Bytes3Type} a
 * @param {import('./Bytes3Type.js').Bytes3Type} b
 * @returns {-1 | 0 | 1}
 */
export function compare(a, b) {
	for (let i = 0; i < 3; i++) {
		const ai = /** @type {number} */ (a[i]);
		const bi = /** @type {number} */ (b[i]);
		if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	return 0;
}
