import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/Hash.js";
/**
 * Brand symbol for type safety
 */
export declare const accessListSymbol: unique symbol;
/**
 * Single access list entry
 * Contains address and its accessed storage keys
 */
export type Item<TAddress extends BrandedAddress = BrandedAddress, TStorageKeys extends readonly HashType[] = readonly HashType[]> = {
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
//# sourceMappingURL=AccessListType.d.ts.map