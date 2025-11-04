import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";

/**
 * Single access list entry
 * Contains address and its accessed storage keys
 */
export type Item<
	TAddress extends Address = Address,
	TStorageKeys extends readonly Hash[] = readonly Hash[],
> = {
	/** Contract address */
	address: TAddress;
	/** Storage keys accessed at this address */
	storageKeys: TStorageKeys;
};

/**
 * Branded AccessList type
 * Array of access list items (EIP-2930)
 */
export type BrandedAccessList = readonly Item[] & {
	readonly __tag: "AccessList";
};
