import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Add storage key to access list for address
 *
 * Adds address if it doesn't exist, then adds storage key if not already present.
 *
 * @param list - Access list to add to
 * @param address - Address to add key for
 * @param storageKey - Storage key to add
 * @returns New access list with storage key added
 *
 * @example
 * ```typescript
 * const list = AccessList([]);
 * const newList = AccessList.withStorageKey(list, address, key); // Static call
 * const newList2 = list.withStorageKey(address, key); // Instance call
 * ```
 */
export declare function withStorageKey(list: BrandedAccessList, address: BrandedAddress, storageKey: HashType): BrandedAccessList;
//# sourceMappingURL=withStorageKey.d.ts.map