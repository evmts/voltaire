import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import type { BrandedAccessList, Item } from "./AccessListType.js";

// Re-export types
export type { BrandedAccessList, Item } from "./AccessListType.js";

// Import constants and re-export with types
import {
	ADDRESS_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	STORAGE_KEY_COST,
	WARM_STORAGE_ACCESS_COST,
} from "./constants.js";

export {
	ADDRESS_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	STORAGE_KEY_COST,
	WARM_STORAGE_ACCESS_COST,
};

// Import functions with types
import { addressCount as _addressCount } from "./addressCount.js";
import { assertValid as _assertValid } from "./assertValid.js";
import { create as _create } from "./create.js";
import { deduplicate as _deduplicate } from "./deduplicate.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { gasCost as _gasCost } from "./gasCost.js";
import { gasSavings as _gasSavings } from "./gasSavings.js";
import { hasSavings as _hasSavings } from "./hasSavings.js";
import { includesAddress as _includesAddress } from "./includesAddress.js";
import { includesStorageKey as _includesStorageKey } from "./includesStorageKey.js";
import { is as _is } from "./is.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";
import { isItem as _isItem } from "./isItem.js";
import { keysFor as _keysFor } from "./keysFor.js";
import { merge as _merge } from "./merge.js";
import { storageKeyCount as _storageKeyCount } from "./storageKeyCount.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { withAddress as _withAddress } from "./withAddress.js";
import { withStorageKey as _withStorageKey } from "./withStorageKey.js";

// Type-safe wrappers
const from: (
	value: readonly Item[] | Uint8Array,
) => BrandedAccessList = _from;
const fromBytes: (bytes: Uint8Array) => BrandedAccessList = _fromBytes;
const is: (value: unknown) => value is BrandedAccessList = _is;
const isItem: (value: unknown) => value is Item = _isItem;
const create: () => BrandedAccessList = _create;
const merge: (...accessLists: BrandedAccessList[]) => BrandedAccessList =
	_merge;
const gasCost: (list: BrandedAccessList) => bigint = _gasCost;
const gasSavings: (list: BrandedAccessList) => bigint = _gasSavings;
const hasSavings: (list: BrandedAccessList) => boolean = _hasSavings;
const includesAddress: (
	list: BrandedAccessList,
	address: AddressType,
) => boolean = _includesAddress;
const includesStorageKey: (
	list: BrandedAccessList,
	address: AddressType,
	storageKey: HashType,
) => boolean = _includesStorageKey;
const keysFor: (
	list: BrandedAccessList,
	address: AddressType,
) => readonly HashType[] | undefined = _keysFor;
const deduplicate: (list: BrandedAccessList) => BrandedAccessList =
	_deduplicate;
const withAddress: (
	list: BrandedAccessList,
	address: AddressType,
) => BrandedAccessList = _withAddress;
const withStorageKey: (
	list: BrandedAccessList,
	address: AddressType,
	storageKey: HashType,
) => BrandedAccessList = _withStorageKey;
const assertValid: (list: BrandedAccessList) => void = _assertValid;
const toBytes: (list: BrandedAccessList) => Uint8Array = _toBytes;
const addressCount: (list: BrandedAccessList) => number = _addressCount;
const storageKeyCount: (list: BrandedAccessList) => number = _storageKeyCount;
const isEmpty: (list: BrandedAccessList) => boolean = _isEmpty;

// Export individual functions
export {
	from,
	fromBytes,
	is,
	isItem,
	create,
	merge,
	gasCost,
	gasSavings,
	hasSavings,
	includesAddress,
	includesStorageKey,
	keysFor,
	deduplicate,
	withAddress,
	withStorageKey,
	assertValid,
	toBytes,
	addressCount,
	storageKeyCount,
	isEmpty,
};

/**
 * Namespace for AccessList operations
 */
const AccessList = {
	from,
	fromBytes,
	is,
	isItem,
	create,
	merge,
	gasCost,
	gasSavings,
	hasSavings,
	includesAddress,
	includesStorageKey,
	keysFor,
	deduplicate,
	withAddress,
	withStorageKey,
	assertValid,
	toBytes,
	addressCount,
	storageKeyCount,
	isEmpty,
	ADDRESS_COST,
	STORAGE_KEY_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	WARM_STORAGE_ACCESS_COST,
};

export { AccessList };
export type { AccessList as AccessListNamespace };
