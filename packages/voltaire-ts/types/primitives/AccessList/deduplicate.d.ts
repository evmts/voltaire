import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Deduplicate access list entries
 *
 * Merges duplicate addresses and removes duplicate storage keys.
 *
 * @param list - Access list to deduplicate
 * @returns Deduplicated access list
 *
 * @example
 * ```typescript
 * const list = AccessList([
 *   { address: addr1, storageKeys: [key1] },
 *   { address: addr1, storageKeys: [key2, key1] },
 * ]);
 * const deduped = AccessList.deduplicate(list); // Static call
 * const deduped2 = list.deduplicate(); // Instance call
 * // Result: [{ address: addr1, storageKeys: [key1, key2] }]
 * ```
 */
export declare function deduplicate(list: BrandedAccessList): BrandedAccessList;
//# sourceMappingURL=deduplicate.d.ts.map