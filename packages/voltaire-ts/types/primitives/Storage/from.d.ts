/**
 * Create a StorageSlot from various input types.
 * Storage slots must be exactly 32 bytes.
 *
 * @param {bigint | number | string | Uint8Array} value - Value to convert
 * @returns {import('./StorageType.js').StorageSlotType} A branded StorageSlot (32 bytes)
 * @throws {Error} If input cannot be converted to 32 bytes
 *
 * @example
 * ```typescript
 * // From bigint
 * const slot1 = Storage.from(0n);
 *
 * // From number
 * const slot2 = Storage.from(0);
 *
 * // From hex string (must be 32 bytes / 64 hex chars)
 * const slot3 = Storage.from('0x' + '00'.repeat(32));
 *
 * // From Uint8Array (must be exactly 32 bytes)
 * const slot4 = Storage.from(new Uint8Array(32));
 * ```
 */
export function from(value: bigint | number | string | Uint8Array): import("./StorageType.js").StorageSlotType;
//# sourceMappingURL=from.d.ts.map