/**
 * Multiply Int256 values with wrapping (EVM MUL with signed interpretation)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} a - First operand
 * @param {import('./Int256Type.js').BrandedInt256} b - Second operand
 * @returns {import('./Int256Type.js').BrandedInt256} Product with wrapping
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(10n);
 * const b = Int256.from(-5n);
 * const product = Int256.times(a, b); // -50n
 * ```
 */
export function times(a: import("./Int256Type.js").BrandedInt256, b: import("./Int256Type.js").BrandedInt256): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=times.d.ts.map