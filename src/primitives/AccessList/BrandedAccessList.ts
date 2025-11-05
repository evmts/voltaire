import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/Hash.js";

/**
 * Brand symbol for type safety
 */
export const accessListSymbol = Symbol("AccessList");

/**
 * Single access list entry
 * Contains address and its accessed storage keys
 */
export type Item<
	TAddress extends BrandedAddress = BrandedAddress,
	TStorageKeys extends readonly BrandedHash[] = readonly BrandedHash[],
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
	readonly __brand?: typeof accessListSymbol;
};
