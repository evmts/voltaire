/**
 * Create Int64 from bigint
 *
 * @param {bigint} value - BigInt to convert
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {IntegerOverflowError} If value exceeds INT64_MAX
 * @throws {IntegerUnderflowError} If value is below INT64_MIN
 */
export function fromBigInt(value: bigint): import("./Int64Type.js").BrandedInt64;
//# sourceMappingURL=fromBigInt.d.ts.map