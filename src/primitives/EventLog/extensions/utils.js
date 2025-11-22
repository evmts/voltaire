/**
 * @internal
 * Compare two hashes for equality (byte-wise)
 *
 * @param {import('../../Hash/HashType.js').HashType} a
 * @param {import('../../Hash/HashType.js').HashType} b
 * @returns {boolean}
 */
export function hashEquals(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

/**
 * @internal
 * Compare two addresses for equality (byte-wise)
 *
 * @param {import('../../Address/AddressType.js').AddressType} a
 * @param {import('../../Address/AddressType.js').AddressType} b
 * @returns {boolean}
 */
export function addressEquals(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
