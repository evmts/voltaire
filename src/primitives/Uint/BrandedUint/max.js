/**
 * Find maximum of multiple Uint256 values
 *
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to compare
 * @returns {import('./BrandedUint.ts').BrandedUint} Maximum value
 *
 * @example
 * ```typescript
 * const result = Uint.max(Uint(100n), Uint(50n), Uint(75n)); // 100
 * ```
 */
export function max(...values) {
	if (values.length === 0) {
		throw new Error("max requires at least one value");
	}
	let result = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
		values[0]
	);
	for (let i = 1; i < values.length; i++) {
		const val = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
			values[i]
		);
		if (val > result) {
			result = val;
		}
	}
	return result;
}
