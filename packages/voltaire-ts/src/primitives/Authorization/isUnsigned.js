/**
 * Check if value is Unsigned
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is Unsigned
 *
 * Note: Type guards don't use this: pattern as they operate on unknown values
 */
export function isUnsigned(value) {
	if (typeof value !== "object" || value === null) return false;
	const auth =
		/** @type {Partial<{chainId: bigint, address: any, nonce: bigint}>} */ (
			value
		);
	return (
		typeof auth.chainId === "bigint" &&
		typeof auth.address === "object" &&
		auth.address !== null &&
		"bytes" in auth.address &&
		typeof auth.nonce === "bigint"
	);
}
