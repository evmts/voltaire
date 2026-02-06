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
export function from(value: number | bigint | string): import("./ValidatorIndexType.js").ValidatorIndexType;
//# sourceMappingURL=from.d.ts.map