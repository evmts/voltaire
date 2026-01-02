import { InvalidRangeError } from "../errors/index.js";

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_INTEGER = BigInt(Number.MIN_SAFE_INTEGER);

/**
 * Convert Int256 to number (warns on overflow)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Int256 value
 * @returns {number} Number value
 * @throws {InvalidRangeError} If value exceeds Number.MAX_SAFE_INTEGER or Number.MIN_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.toNumber(a); // -42
 * ```
 */
export function toNumber(value) {
	if (value > MAX_SAFE_INTEGER) {
		throw new InvalidRangeError(`Int256 value exceeds Number.MAX_SAFE_INTEGER: ${value}`, {
			value,
			expected: `between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}`,
			docsPath: "/primitives/int256#to-number",
		});
	}

	if (value < MIN_SAFE_INTEGER) {
		throw new InvalidRangeError(`Int256 value below Number.MIN_SAFE_INTEGER: ${value}`, {
			value,
			expected: `between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}`,
			docsPath: "/primitives/int256#to-number",
		});
	}

	return Number(value);
}
