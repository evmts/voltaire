/**
 * WASM bindings for access-list primitive (EIP-2930)
 * Provides lightweight bindings to Zig implementation via WASM
 */

import * as loader from "../../wasm-loader/loader.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/Hash.js";
import type { BrandedAccessList as AccessListType } from "./AccessListType.js";

type LoaderAccessList = Parameters<typeof loader.accessListGasCost>[0];

/**
 * Calculate total gas cost for access list
 * @param accessList - Access list to calculate cost for
 * @returns Gas cost as bigint
 */
export function gasCostWasm(accessList: AccessListType): bigint {
	return loader.accessListGasCost(accessList as unknown as LoaderAccessList);
}

/**
 * Calculate gas savings from using access list
 * @param accessList - Access list to calculate savings for
 * @returns Gas savings as bigint
 */
export function gasSavingsWasm(accessList: AccessListType): bigint {
	return loader.accessListGasSavings(accessList as unknown as LoaderAccessList);
}

/**
 * Check if address is in access list
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @returns True if address is in list
 */
export function includesAddressWasm(
	accessList: AccessListType,
	address: BrandedAddress,
): boolean {
	return loader.accessListIncludesAddress(
		accessList as unknown as LoaderAccessList,
		address,
	);
}

/**
 * Check if storage key is in access list for address
 * @param accessList - Access list to check
 * @param address - Address to look for
 * @param storageKey - Storage key to look for
 * @returns True if storage key is in list for address
 */
export function includesStorageKeyWasm(
	accessList: AccessListType,
	address: BrandedAddress,
	storageKey: HashType,
): boolean {
	return loader.accessListIncludesStorageKey(
		accessList as unknown as LoaderAccessList,
		address,
		storageKey,
	);
}
