/**
 * @param {import('./Bytes2Type.js').Bytes2Type} a
 * @param {import('./Bytes2Type.js').Bytes2Type} b
 * @returns {boolean}
 */
export function equals(a, b) {
	for (let i = 0; i < 2; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
