export function compare(a, b) {
	for (let i = 0; i < 3; i++) {
		const ai = /** @type {number} */ (a[i]); const bi = /** @type {number} */ (b[i]); if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	return 0;
}
