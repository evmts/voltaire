/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 * @typedef {import('./StorageValueType.js').StorageValueLike} StorageValueLike
 */
/**
 * Creates a StorageValue from various input types.
 * Accepts bigint, hex strings, Uint8Array, or existing StorageValue instances.
 *
 * @param {StorageValueLike} value - The value to convert
 * @returns {StorageValueType} - A branded StorageValue
 *
 * @example
 * ```typescript
 * const val = StorageValue.from(123n);
 * const val2 = StorageValue.from("0x1234...");
 * const val3 = StorageValue.from(new Uint8Array(32));
 * ```
 */
export function from(value: StorageValueLike): StorageValueType;
export type StorageValueType = import("./StorageValueType.js").StorageValueType;
export type StorageValueLike = import("./StorageValueType.js").StorageValueLike;
//# sourceMappingURL=from.d.ts.map