import type { brand } from "../../brand.js";

/**
 * Storage slot type (32 bytes)
 * Represents a storage location in Ethereum contract storage
 */
export type StorageSlotType = Uint8Array & {
	readonly [brand]: "StorageSlot";
};
