/**
 * Convert ValidatorIndex to number
 *
 * @see https://voltaire.tevm.sh/primitives/validator-index for ValidatorIndex documentation
 * @since 0.0.0
 * @param {import('./ValidatorIndexType.js').ValidatorIndexType} index - ValidatorIndex value
 * @returns {number} Number representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as ValidatorIndex from './primitives/ValidatorIndex/index.js';
 * const idx = ValidatorIndex.from(123456);
 * const num = ValidatorIndex.toNumber(idx); // 123456
 * ```
 */
export function toNumber(index: import("./ValidatorIndexType.js").ValidatorIndexType): number;
//# sourceMappingURL=toNumber.d.ts.map