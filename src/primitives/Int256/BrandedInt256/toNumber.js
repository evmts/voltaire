/**
 * Convert Int256 to number (warns on overflow)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Int256 value
 * @returns {number} Number value
 * @throws {Error} If value exceeds Number.MAX_SAFE_INTEGER or Number.MIN_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.toNumber(a); // -42
 * ```
 */
export function toNumber(value) {
	if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`Int256 value exceeds Number.MAX_SAFE_INTEGER: ${value}`);
	}

	if (value < BigInt(Number.MIN_SAFE_INTEGER)) {
		throw new Error(`Int256 value below Number.MIN_SAFE_INTEGER: ${value}`);
	}

	return Number(value);
}
