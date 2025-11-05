/**
 * Type declarations for AccessList.js
 */

import type { BrandedAddress } from "../Address/index.js";
import type { BrandedHash } from "../Hash/index.js";
import type { BrandedAccessList, Item } from "./BrandedAccessList.js";

export declare function from(
	value: readonly Item[] | Uint8Array,
): BrandedAccessList;
export declare function fromBytes(value: Uint8Array): BrandedAccessList;
export declare function is(value: unknown): value is BrandedAccessList;
export declare function isItem(value: unknown): value is Item;
export declare function create(): BrandedAccessList;
export declare function merge(
	...lists: readonly BrandedAccessList[]
): BrandedAccessList;
export declare function gasCost(list: BrandedAccessList): bigint;
export declare function gasSavings(list: BrandedAccessList): bigint;
export declare function hasSavings(list: BrandedAccessList): boolean;
export declare function includesAddress(
	list: BrandedAccessList,
	address: BrandedAddress,
): boolean;
export declare function includesStorageKey(
	list: BrandedAccessList,
	address: BrandedAddress,
	key: BrandedHash,
): boolean;
export declare function keysFor(
	list: BrandedAccessList,
	address: BrandedAddress,
): readonly BrandedHash[] | undefined;
export declare function deduplicate(list: BrandedAccessList): BrandedAccessList;
export declare function withAddress(
	list: BrandedAccessList,
	address: BrandedAddress,
): BrandedAccessList;
export declare function withStorageKey(
	list: BrandedAccessList,
	address: BrandedAddress,
	key: BrandedHash,
): BrandedAccessList;
export declare function assertValid(
	list: unknown,
): asserts list is BrandedAccessList;
export declare function toBytes(list: BrandedAccessList): Uint8Array;
export declare function addressCount(list: BrandedAccessList): number;
export declare function storageKeyCount(list: BrandedAccessList): number;
export declare function isEmpty(list: BrandedAccessList): boolean;

export declare const AccessList: {
	(value: readonly Item[] | Uint8Array): BrandedAccessList;
	from: typeof from;
	fromBytes: typeof fromBytes;
	is: typeof is;
	isItem: typeof isItem;
	create: typeof create;
	merge: typeof merge;
	gasCost: typeof gasCost;
	gasSavings: typeof gasSavings;
	hasSavings: typeof hasSavings;
	includesAddress: typeof includesAddress;
	includesStorageKey: typeof includesStorageKey;
	keysFor: typeof keysFor;
	deduplicate: typeof deduplicate;
	withAddress: typeof withAddress;
	withStorageKey: typeof withStorageKey;
	assertValid: typeof assertValid;
	toBytes: typeof toBytes;
	addressCount: typeof addressCount;
	storageKeyCount: typeof storageKeyCount;
	isEmpty: typeof isEmpty;
	ADDRESS_COST: bigint;
	STORAGE_KEY_COST: bigint;
	COLD_ACCOUNT_ACCESS_COST: bigint;
	COLD_STORAGE_ACCESS_COST: bigint;
	WARM_STORAGE_ACCESS_COST: bigint;
};
