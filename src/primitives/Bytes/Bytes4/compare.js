/** @param {Uint8Array} a @param {Uint8Array} b */
export function compare(a, b) {
	for (let i = 0; i < 4; i++) {
		const ai = /** @type {number} */ (a[i]);
		const bi = /** @type {number} */ (b[i]);
		if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	return 0;
}
