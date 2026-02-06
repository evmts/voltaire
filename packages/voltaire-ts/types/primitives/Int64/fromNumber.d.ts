/**
 * Create Int64 from number
 *
 * @param {number} value - Number to convert
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidFormatError} If value is NaN or Infinity
 * @throws {IntegerOverflowError} If value exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If value is below INT64_MIN
 */
export function fromNumber(value: number): import("./Int64Type.js").BrandedInt64;
//# sourceMappingURL=fromNumber.d.ts.map