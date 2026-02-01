/**
 * Add Int256 values with wrapping (EVM ADD with signed interpretation)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} a - First operand
 * @param {import('./Int256Type.js').BrandedInt256} b - Second operand
 * @returns {import('./Int256Type.js').BrandedInt256} Sum with wrapping
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-100n);
 * const b = Int256.from(50n);
 * const sum = Int256.plus(a, b); // -50n
 * ```
 */
export function plus(a: import("./Int256Type.js").BrandedInt256, b: import("./Int256Type.js").BrandedInt256): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=plus.d.ts.map