/**
 * WASM bindings for access-list primitive (EIP-2930)
 * Provides lightweight bindings to Zig implementation via WASM
 */
import * as loader from "../../wasm-loader/loader.js";
/**
 * Calculate total gas cost for access list
 * @param accessList - Access list to calculate cost for
 * @returns Gas cost as bigint
 */
export function gasCostWasm(accessList) {
    // biome-ignore lint/suspicious/noExplicitAny: wasm loader interface requires any
    return loader.accessListGasCost(accessList);
}
/**
 * Calculate gas savings from using access list
 * @param accessList - Access list to calculate savings for
 * @returns Gas savings as bigint
 */
export function gasSavingsWasm(accessList) {
    // biome-ignore lint/suspicious/noExplicitAny: wasm loader interface requires any
    return loader.accessListGasSavings(accessList);
}
/**
 * Check if address is in access list
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @returns True if address is in list
 */
export function includesAddressWasm(accessList, address) {
    // biome-ignore lint/suspicious/noExplicitAny: wasm loader interface requires any
    return loader.accessListIncludesAddress(accessList, address);
}
/**
 * Check if storage key is in access list for address
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @param storageKey - Storage key to look for
 * @returns True if storage key is in list for address
 */
export function includesStorageKeyWasm(accessList, address, storageKey) {
    return loader.accessListIncludesStorageKey(
    // biome-ignore lint/suspicious/noExplicitAny: wasm loader interface requires any
    accessList, address, storageKey);
}
