import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
/**
 * Composite key for EVM storage operations combining address and slot.
 *
 * The StorageKey uniquely identifies a storage location within the EVM by
 * combining a contract address with a 256-bit storage slot number. This is
 * fundamental to how the EVM organizes persistent contract storage.
 *
 * ## Design Rationale
 * Each smart contract has its own isolated storage space addressed by 256-bit
 * slots. To track storage across multiple contracts in a single VM instance,
 * we need a composite key that includes both the contract address and the
 * slot number.
 *
 * ## Storage Model
 * In the EVM:
 * - Each contract has 2^256 storage slots
 * - Each slot can store a 256-bit value
 * - Slots are initially zero and only consume gas when first written
 *
 * @example
 * ```typescript
 * const key: StorageKeyType = {
 *   address: myContractAddress,
 *   slot: 0n, // First storage slot
 * };
 *
 * // Use in maps for storage tracking
 * const storage = new Map<string, bigint>();
 * const keyStr = StorageKey.toString(key);
 * storage.set(keyStr, value);
 * ```
 */
export type StorageKeyType = {
    /**
     * The contract address that owns this storage slot.
     * Standard 20-byte Ethereum address.
     */
    readonly address: BrandedAddress;
    /**
     * The 256-bit storage slot number within the contract's storage space.
     * Slots are sparsely allocated - most remain at zero value.
     */
    readonly slot: bigint;
};
/**
 * Alias for StorageKeyType for backward compatibility
 */
export type StorageKey = StorageKeyType;
/**
 * Inputs that can be converted to StorageKeyType
 */
export type StorageKeyLike = StorageKeyType | {
    address: BrandedAddress;
    slot: bigint;
};
//# sourceMappingURL=StorageKeyType.d.ts.map