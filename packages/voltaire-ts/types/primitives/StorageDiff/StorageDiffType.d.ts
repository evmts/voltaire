import type { AddressType } from "../Address/AddressType.js";
import type { StorageKeyType } from "../State/StorageKeyType.js";
import type { StorageValueType } from "../StorageValue/StorageValueType.js";
/**
 * Storage slot change for a single account
 *
 * Tracks before/after values for storage slots.
 * null indicates slot didn't exist (before) or was deleted (after).
 */
export type StorageChange = {
    readonly from: StorageValueType | null;
    readonly to: StorageValueType | null;
};
/**
 * Storage changes for an account during transaction execution
 *
 * Maps storage slots to their before/after values.
 * Used for state diff analysis, particularly with debug_traceTransaction.
 *
 * @example
 * ```typescript
 * const diff: StorageDiffType = {
 *   address: myAddress,
 *   changes: new Map([
 *     [{ address: myAddress, slot: 0n }, { from: oldValue, to: newValue }],
 *   ]),
 * };
 * ```
 */
export type StorageDiffType = {
    /**
     * Contract address for these storage changes
     */
    readonly address: AddressType;
    /**
     * Map of storage slot changes
     * Key: StorageKey (address + slot)
     * Value: Before/after storage values
     */
    readonly changes: ReadonlyMap<StorageKeyType, StorageChange>;
};
//# sourceMappingURL=StorageDiffType.d.ts.map