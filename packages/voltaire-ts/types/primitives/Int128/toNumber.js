import { InvalidRangeError } from "../errors/index.js";
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_INTEGER = BigInt(Number.MIN_SAFE_INTEGER);
/**
 * Convert Int128 to number (warns on overflow)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Int128 value
 * @returns {number} Number value
 * @throws {InvalidRangeError} If value exceeds Number.MAX_SAFE_INTEGER or Number.MIN_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.toNumber(a); // -42
 * ```
 */
export function toNumber(value) {
    if (value > MAX_SAFE_INTEGER) {
        throw new InvalidRangeError(`Int128 value exceeds Number.MAX_SAFE_INTEGER: ${value}`, {
            value,
            expected: `between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}`,
            docsPath: "/primitives/int128#to-number",
        });
    }
    if (value < MIN_SAFE_INTEGER) {
        throw new InvalidRangeError(`Int128 value below Number.MIN_SAFE_INTEGER: ${value}`, {
            value,
            expected: `between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}`,
            docsPath: "/primitives/int128#to-number",
        });
    }
    return Number(value);
}
