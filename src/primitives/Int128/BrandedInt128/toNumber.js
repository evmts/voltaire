/**
 * Convert Int128 to number (warns on overflow)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Int128 value
 * @returns {number} Number value
 * @throws {Error} If value exceeds Number.MAX_SAFE_INTEGER or Number.MIN_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.toNumber(a); // -42
 * ```
 */
export function toNumber(value) {
	if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(
			`Int128 value exceeds Number.MAX_SAFE_INTEGER: ${value}`,
		);
	}

	if (value < BigInt(Number.MIN_SAFE_INTEGER)) {
		throw new Error(
			`Int128 value below Number.MIN_SAFE_INTEGER: ${value}`,
		);
	}

	return Number(value);
}
