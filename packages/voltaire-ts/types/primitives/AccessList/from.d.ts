import type { BrandedAccessList, Item } from "./AccessListType.js";
/**
 * Create AccessList from array or bytes
 *
 * @param value - AccessList items or RLP bytes
 * @returns AccessList
 *
 * @example
 * ```typescript
 * const list = AccessList.from([{ address, storageKeys: [] }]);
 * const list2 = AccessList.from(bytes); // from RLP bytes
 * ```
 */
export declare function from(value: readonly Item[] | Uint8Array): BrandedAccessList;
//# sourceMappingURL=from.d.ts.map