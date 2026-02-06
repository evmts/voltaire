/**
 * Create Int64 from various input types
 *
 * @param {bigint | number | string} value - Value to convert
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidFormatError} If value cannot be converted
 * @throws {IntegerOverflowError} If value exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If value is below INT64_MIN
 * @example
 * ```javascript
 * import * as Int64 from './primitives/Int64/index.js';
 * const a = Int64.from(-42n);
 * const b = Int64.from("123");
 * const c = Int64.from(42);
 * ```
 */
export function from(value: bigint | number | string): import("./Int64Type.js").BrandedInt64;
//# sourceMappingURL=from.d.ts.map