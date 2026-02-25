/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */
/**
 * Converts a StorageValue to a hex string.
 *
 * @param {StorageValueType} value - The StorageValue to convert
 * @returns {import('../Hex/HexType.js').HexType} - Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = StorageValue.toHex(val);
 * // "0x0000000000000000000000000000000000000000000000000000000000000123"
 * ```
 */
export function toHex(value: StorageValueType): import("../Hex/HexType.js").HexType;
export type StorageValueType = import("./StorageValueType.js").StorageValueType;
//# sourceMappingURL=toHex.d.ts.map