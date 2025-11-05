/**
 * Check if two RLP Data structures are equal
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data - First Data
 * @param {import('./BrandedRlp.js').BrandedRlp} other - Second Data
 * @returns {boolean} True if equal
 *
 * @example
 * ```javascript
 * const a = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * const b = { type: 'bytes', value: new Uint8Array([1, 2]) };
 * Rlp.equals(a, b); // => true
 * ```
 */
export function equals(data, other) {
	if (data.type !== other.type) {
		return false;
	}

	if (data.type === "bytes" && other.type === "bytes") {
		if (data.value.length !== other.value.length) {
			return false;
		}
		for (let i = 0; i < data.value.length; i++) {
			if (data.value[i] !== other.value[i]) {
				return false;
			}
		}
		return true;
	}

	if (data.type === "list" && other.type === "list") {
		if (data.value.length !== other.value.length) {
			return false;
		}
		for (let i = 0; i < data.value.length; i++) {
			const dataItem = data.value[i];
			const otherItem = other.value[i];
			if (!dataItem || !otherItem || !equals(dataItem, otherItem)) {
				return false;
			}
		}
		return true;
	}

	return false;
}
