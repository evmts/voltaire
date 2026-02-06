/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */
/**
 * Creates a StorageValue from a hex string.
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {StorageValueType} - A branded StorageValue
 *
 * @example
 * ```typescript
 * const val = StorageValue.fromHex("0x1234...");
 * ```
 */
export function fromHex(hex: string): StorageValueType;
export type StorageValueType = import("./StorageValueType.js").StorageValueType;
//# sourceMappingURL=fromHex.d.ts.map