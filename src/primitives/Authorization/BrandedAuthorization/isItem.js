/**
 * Check if value is Item
 *
 * Note: Type guards don't use this: pattern as they operate on unknown values
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is Item
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const value = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * if (Authorization.isItem(value)) {
 *   // value is Item
 * }
 * ```
 */
export function isItem(value) {
	if (typeof value !== "object" || value === null) return false;
	const auth =
		/** @type {Partial<import("./BrandedAuthorization.js").BrandedAuthorization>} */ (
			value
		);
	return (
		typeof auth.chainId === "bigint" &&
		typeof auth.address === "object" &&
		auth.address !== null &&
		"bytes" in auth.address &&
		typeof auth.nonce === "bigint" &&
		typeof auth.yParity === "number" &&
		typeof auth.r === "bigint" &&
		typeof auth.s === "bigint"
	);
}
