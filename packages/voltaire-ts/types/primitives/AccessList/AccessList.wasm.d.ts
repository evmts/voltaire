/**
 * WASM bindings for access-list primitive (EIP-2930)
 * Provides lightweight bindings to Zig implementation via WASM
 */
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/Hash.js";
import type { BrandedAccessList as AccessListType } from "./AccessListType.js";
/**
 * Calculate total gas cost for access list
 * @param accessList - Access list to calculate cost for
 * @returns Gas cost as bigint
 */
export declare function gasCostWasm(accessList: AccessListType): bigint;
/**
 * Calculate gas savings from using access list
 * @param accessList - Access list to calculate savings for
 * @returns Gas savings as bigint
 */
export declare function gasSavingsWasm(accessList: AccessListType): bigint;
/**
 * Check if address is in access list
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @returns True if address is in list
 */
export declare function includesAddressWasm(accessList: AccessListType, address: BrandedAddress): boolean;
/**
 * Check if storage key is in access list for address
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @param storageKey - Storage key to look for
 * @returns True if storage key is in list for address
 */
export declare function includesStorageKeyWasm(accessList: AccessListType, address: BrandedAddress, storageKey: HashType): boolean;
//# sourceMappingURL=AccessList.wasm.d.ts.map