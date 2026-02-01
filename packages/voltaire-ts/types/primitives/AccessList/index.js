// Import constants and re-export with types
import { ADDRESS_COST, COLD_ACCOUNT_ACCESS_COST, COLD_STORAGE_ACCESS_COST, STORAGE_KEY_COST, WARM_STORAGE_ACCESS_COST, } from "./constants.js";
export { ADDRESS_COST, COLD_ACCOUNT_ACCESS_COST, COLD_STORAGE_ACCESS_COST, STORAGE_KEY_COST, WARM_STORAGE_ACCESS_COST, };
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
const from = _from;
const fromBytes = _fromBytes;
const is = _is;
const isItem = _isItem;
const create = _create;
const merge = _merge;
const gasCost = _gasCost;
const gasSavings = _gasSavings;
const hasSavings = _hasSavings;
const includesAddress = _includesAddress;
const includesStorageKey = _includesStorageKey;
const keysFor = _keysFor;
const deduplicate = _deduplicate;
const withAddress = _withAddress;
const withStorageKey = _withStorageKey;
const assertValid = _assertValid;
const toBytes = _toBytes;
const addressCount = _addressCount;
const storageKeyCount = _storageKeyCount;
const isEmpty = _isEmpty;
// Export individual functions
export { from, fromBytes, is, isItem, create, merge, gasCost, gasSavings, hasSavings, includesAddress, includesStorageKey, keysFor, deduplicate, withAddress, withStorageKey, assertValid, toBytes, addressCount, storageKeyCount, isEmpty, };
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
