/**
 * @typedef {import('../../Address/index.js').AddressType} BrandedAddress
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 */

/**
 * Compare two hashes for equality
 * @internal
 * @param {HashType} a
 * @param {HashType} b
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
 * Compare two addresses for equality (byte-wise comparison)
 * @internal
 * @param {BrandedAddress} a
 * @param {BrandedAddress} b
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
