/**
 * Check if this authorization equals another
 *
 * @param {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} a - First address
 * @param {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} b - Second address
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const auth1: Item = {...};
 * const auth2: Item = {...};
 * if (equals(auth1, auth2)) {
 *   console.log('Authorizations are equal');
 * }
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Check if authorization equals another
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth1 - First authorization
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth2 - Second authorization
 * @returns {boolean} True if equal
 */
export function equalsAuth(auth1, auth2) {
	return (
		auth1.chainId === auth2.chainId &&
		equals(auth1.address, auth2.address) &&
		auth1.nonce === auth2.nonce &&
		auth1.yParity === auth2.yParity &&
		auth1.r === auth2.r &&
		auth1.s === auth2.s
	);
}
