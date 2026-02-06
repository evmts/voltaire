/**
 * Check if ValidatorIndex values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/validator-index for ValidatorIndex documentation
 * @since 0.0.0
 * @param {import('./ValidatorIndexType.js').ValidatorIndexType} a - First validator index
 * @param {import('./ValidatorIndexType.js').ValidatorIndexType} b - Second validator index
 * @returns {boolean} true if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as ValidatorIndex from './primitives/ValidatorIndex/index.js';
 * const a = ValidatorIndex.from(123456);
 * const b = ValidatorIndex.from(123456);
 * const result = ValidatorIndex.equals(a, b); // true
 * ```
 */
export function equals(a: import("./ValidatorIndexType.js").ValidatorIndexType, b: import("./ValidatorIndexType.js").ValidatorIndexType): boolean;
//# sourceMappingURL=equals.d.ts.map