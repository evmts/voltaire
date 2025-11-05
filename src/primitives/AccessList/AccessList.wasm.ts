/**
 * WASM bindings for access-list primitive (EIP-2930)
 * Provides lightweight bindings to Zig implementation via WASM
 */

import * as loader from "../../wasm-loader/loader.js";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/Hash.js";
import type * as AccessList from "./AccessList.js";

/**
 * Calculate total gas cost for access list
 * @param accessList - Access list to calculate cost for
 * @returns Gas cost as bigint
 */
export function gasCostWasm(accessList: AccessList.Type): bigint {
	return loader.accessListGasCost(accessList as any);
}

/**
 * Calculate gas savings from using access list
 * @param accessList - Access list to calculate savings for
 * @returns Gas savings as bigint
 */
export function gasSavingsWasm(accessList: AccessList.Type): bigint {
	return loader.accessListGasSavings(accessList as any);
}

/**
 * Check if address is in access list
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @returns True if address is in list
 */
export function includesAddressWasm(
	accessList: AccessList.Type,
	address: BrandedAddress,
): boolean {
	return loader.accessListIncludesAddress(accessList as any, address);
}

/**
 * Check if storage key is in access list for address
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @param storageKey - Storage key to look for
 * @returns True if storage key is in list for address
 */
export function includesStorageKeyWasm(
	accessList: AccessList.Type,
	address: BrandedAddress,
	storageKey: BrandedHash,
): boolean {
	return loader.accessListIncludesStorageKey(
		accessList as any,
		address,
		storageKey,
	);
}
