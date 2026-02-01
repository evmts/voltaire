import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Encode access list to RLP
 *
 * @param list - Access list to encode
 * @returns RLP-encoded bytes
 *
 * Format: [[address, [storageKey1, storageKey2, ...]], ...]
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const encoded = AccessList.toBytes(list); // Static call
 * const encoded2 = list.toBytes(); // Instance call
 * ```
 */
export declare function toBytes(list: BrandedAccessList): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map