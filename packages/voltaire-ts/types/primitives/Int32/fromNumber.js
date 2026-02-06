import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, } from "../errors/index.js";
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
/**
 * Create Int32 from number
 *
 * @param {number} value - Number to convert
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidFormatError} If value is NaN
 * @throws {IntegerOverflowError} If value exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If value is below INT32_MIN
 */
export function fromNumber(value) {
    if (Number.isNaN(value)) {
        throw new InvalidFormatError("Cannot create Int32 from NaN", {
            value,
            expected: "valid number",
            docsPath: "/primitives/int32#from-number",
        });
    }
    // Check bounds BEFORE truncation to detect overflow
    if (value > INT32_MAX) {
        throw new IntegerOverflowError(`Int32 value exceeds maximum: ${value}`, {
            value,
            max: INT32_MAX,
            type: "int32",
        });
    }
    if (value < INT32_MIN) {
        throw new IntegerUnderflowError(`Int32 value is below minimum: ${value}`, {
            value,
            min: INT32_MIN,
            type: "int32",
        });
    }
    // Truncate to 32-bit signed integer (bounds already checked above)
    const num = value | 0;
    return /** @type {import('./Int32Type.js').BrandedInt32} */ (num);
}
