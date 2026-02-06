/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */
/**
 * Compares two StorageValues for equality.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {StorageValueType} a - First StorageValue
 * @param {StorageValueType} b - Second StorageValue
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = StorageValue.equals(val1, val2);
 * ```
 */
export function equals(a: StorageValueType, b: StorageValueType): boolean;
export type StorageValueType = import("./StorageValueType.js").StorageValueType;
//# sourceMappingURL=equals.d.ts.map