import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Check if address is in access list
 *
 * @param list - Access list to search
 * @param address - Address to find
 * @returns true if address is in access list
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const hasAddress = AccessList.includesAddress(list, address); // Static call
 * const hasAddress2 = list.includesAddress(address); // Instance call
 * ```
 */
export declare function includesAddress(list: BrandedAccessList, address: BrandedAddress): boolean;
//# sourceMappingURL=includesAddress.d.ts.map