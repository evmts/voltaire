import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Check if storage key is in access list for given address
 *
 * @param list - Access list to search
 * @param address - Address to check
 * @param storageKey - Storage key to find
 * @returns true if storage key is accessible
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key] }]);
 * const isAccessible = AccessList.includesStorageKey(list, address, key); // Static call
 * const isAccessible2 = list.includesStorageKey(address, key); // Instance call
 * ```
 */
export declare function includesStorageKey(list: BrandedAccessList, address: BrandedAddress, storageKey: HashType): boolean;
//# sourceMappingURL=includesStorageKey.d.ts.map