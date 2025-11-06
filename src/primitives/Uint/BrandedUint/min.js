/**
 * Find minimum of multiple Uint256 values
 *
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to compare
 * @returns {import('./BrandedUint.ts').BrandedUint} Minimum value
 *
 * @example
 * ```typescript
 * const result = Uint.min(Uint(100n), Uint(50n), Uint(75n)); // 50
 * ```
 */
export function min(...values) {
	if (values.length === 0) {
		throw new Error("min requires at least one value");
	}
	let result = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
		values[0]
	);
	for (let i = 1; i < values.length; i++) {
		const val = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
			values[i]
		);
		if (val < result) {
			result = val;
		}
	}
	return result;
}
