/**
 * Create ValidatorIndex from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/validator-index for ValidatorIndex documentation
 * @since 0.0.0
 * @param {number | bigint | string} value - Validator index (number, bigint, or decimal/hex string)
 * @returns {import('./ValidatorIndexType.js').ValidatorIndexType} ValidatorIndex value
 * @throws {Error} If value is negative, not an integer, or out of range
 * @example
 * ```javascript
 * import * as ValidatorIndex from './primitives/ValidatorIndex/index.js';
 * const idx1 = ValidatorIndex.from(123456);
 * const idx2 = ValidatorIndex.from(123456n);
 * const idx3 = ValidatorIndex.from("0x1e240");
 * ```
 */
export function from(value) {
    let numberValue;
    if (typeof value === "string") {
        if (value.startsWith("0x") || value.startsWith("0X")) {
            numberValue = Number(BigInt(value));
        }
        else {
            numberValue = Number(value);
        }
    }
    else if (typeof value === "bigint") {
        numberValue = Number(value);
    }
    else {
        numberValue = value;
    }
    if (!Number.isSafeInteger(numberValue)) {
        throw new Error(`ValidatorIndex value must be a safe integer: ${value}`);
    }
    if (!Number.isInteger(numberValue)) {
        throw new Error(`ValidatorIndex value must be an integer: ${value}`);
    }
    if (numberValue < 0) {
        throw new Error(`ValidatorIndex value cannot be negative: ${numberValue}`);
    }
    return /** @type {import('./ValidatorIndexType.js').ValidatorIndexType} */ (numberValue);
}
