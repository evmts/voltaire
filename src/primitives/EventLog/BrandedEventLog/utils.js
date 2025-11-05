/**
 * @typedef {import('../Address/index.js').BrandedAddress} BrandedAddress
 * @typedef {import('../Hash/index.js').BrandedHash} BrandedHash
 */

/**
 * Compare two hashes for equality
 * @internal
 * @param {BrandedHash} a
 * @param {BrandedHash} b
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
