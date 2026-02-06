import { InvalidRangeError } from "../errors/index.js";
const MAX_SAFE_INTEGER = 9007199254740991n;
const MIN_SAFE_INTEGER = -9007199254740991n;
/**
 * Convert Int64 to number
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Int64 value
 * @returns {number} Number value
 * @throws {InvalidRangeError} If value exceeds safe integer range
 */
export function toNumber(value) {
    if (value > MAX_SAFE_INTEGER) {
        throw new InvalidRangeError(`Int64 value ${value} exceeds Number.MAX_SAFE_INTEGER`, {
            value,
            expected: `between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}`,
            docsPath: "/primitives/int64#to-number",
        });
    }
    if (value < MIN_SAFE_INTEGER) {
        throw new InvalidRangeError(`Int64 value ${value} below Number.MIN_SAFE_INTEGER`, {
            value,
            expected: `between ${MIN_SAFE_INTEGER} and ${MAX_SAFE_INTEGER}`,
            docsPath: "/primitives/int64#to-number",
        });
    }
    return Number(value);
}
