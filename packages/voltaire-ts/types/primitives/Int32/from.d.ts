/**
 * Create Int32 from various input types
 *
 * @param {number | bigint | string} value - Value to convert
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidFormatError} If value cannot be converted
 * @throws {IntegerOverflowError} If value exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If value is below INT32_MIN
 * @example
 * ```javascript
 * import * as Int32 from './primitives/Int32/index.js';
 * const a = Int32.from(-42);
 * const b = Int32.from("123");
 * const c = Int32.from(-2147483648n);
 * ```
 */
export function from(value: number | bigint | string): import("./Int32Type.js").BrandedInt32;
//# sourceMappingURL=from.d.ts.map