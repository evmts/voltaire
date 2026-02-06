import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Get all storage keys for an address
 *
 * @param list - Access list to search
 * @param address - Address to get keys for
 * @returns Array of storage keys, or undefined if address not found
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1, key2] }]);
 * const keys = AccessList.keysFor(list, address); // Static call
 * const keys2 = list.keysFor(address); // Instance call
 * if (keys) {
 *   console.log(`Found ${keys.length} storage keys`);
 * }
 * ```
 */
export declare function keysFor(list: BrandedAccessList, address: BrandedAddress): readonly HashType[] | undefined;
//# sourceMappingURL=keysFor.d.ts.map