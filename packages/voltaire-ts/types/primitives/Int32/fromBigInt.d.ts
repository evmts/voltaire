/**
 * Create Int32 from bigint
 *
 * @param {bigint} value - BigInt to convert
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {IntegerOverflowError} If value exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If value is below INT32_MIN
 */
export function fromBigInt(value: bigint): import("./Int32Type.js").BrandedInt32;
//# sourceMappingURL=fromBigInt.d.ts.map