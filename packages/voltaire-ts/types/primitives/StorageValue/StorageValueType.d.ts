import type { brand } from "../../brand.js";
/**
 * Branded StorageValue type - represents a 32-byte EVM storage slot value.
 *
 * In the EVM, each contract has 2^256 storage slots, and each slot stores
 * a 32-byte (256-bit) value. Storage is the persistent key-value store
 * used by smart contracts to maintain state between transactions.
 *
 * Storage slots start at zero and are lazily allocated - reading an
 * uninitialized slot returns zero, and writing zero to a slot can
 * trigger a gas refund.
 */
export type StorageValueType = Uint8Array & {
    readonly [brand]: "StorageValue";
    readonly length: 32;
};
/**
 * Inputs that can be converted to StorageValue
 */
export type StorageValueLike = StorageValueType | bigint | string | Uint8Array;
export declare const SIZE = 32;
//# sourceMappingURL=StorageValueType.d.ts.map