/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */
/**
 * Converts a StorageValue to a bigint (Uint256).
 *
 * @param {StorageValueType} value - The StorageValue to convert
 * @returns {bigint} - The numeric value as bigint
 *
 * @example
 * ```typescript
 * const val = StorageValue.from(123n);
 * const num = StorageValue.toUint256(val);
 * // 123n
 * ```
 */
export function toUint256(value: StorageValueType): bigint;
export type StorageValueType = import("./StorageValueType.js").StorageValueType;
//# sourceMappingURL=toUint256.d.ts.map