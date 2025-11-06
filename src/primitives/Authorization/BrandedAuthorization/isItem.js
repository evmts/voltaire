/**
 * Check if value is Item
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is Item
 *
 * @example
 * ```typescript
 * const value: unknown = {...};
 * if (isItem(value)) {
 *   // value is Item
 * }
 * ```
 *
 * Note: Type guards don't use this: pattern as they operate on unknown values
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
