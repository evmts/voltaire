// @ts-nocheck
export * from "./constants.js";

import { addressCount } from "./addressCount.js";
import { assertValid } from "./assertValid.js";
import {
	ADDRESS_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	STORAGE_KEY_COST,
	WARM_STORAGE_ACCESS_COST,
} from "./constants.js";
import { create } from "./create.js";
import { deduplicate } from "./deduplicate.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { gasCost } from "./gasCost.js";
import { gasSavings } from "./gasSavings.js";
import { hasSavings } from "./hasSavings.js";
import { includesAddress } from "./includesAddress.js";
import { includesStorageKey } from "./includesStorageKey.js";
import { is } from "./is.js";
import { isEmpty } from "./isEmpty.js";
import { isItem } from "./isItem.js";
import { keysFor } from "./keysFor.js";
import { merge } from "./merge.js";
import { storageKeyCount } from "./storageKeyCount.js";
import { toBytes } from "./toBytes.js";
import { withAddress } from "./withAddress.js";
import { withStorageKey } from "./withStorageKey.js";

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

// Namespace export
export const BrandedAccessList = {
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
