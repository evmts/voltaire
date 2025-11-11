/**
 * Check if two addresses are equal
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} a - First address
 * @param {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} b - Second address
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const addr1 = '0x742d35Cc...';
 * const addr2 = '0x742d35Cc...';
 * if (Authorization.equals(addr1, addr2)) {
 *   console.log('Addresses are equal');
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
