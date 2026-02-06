// Import functions with proper types
import { allIds as _allIds } from "./allIds.js";
import { allNames as _allNames } from "./allNames.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { fromString as _fromString } from "./fromString.js";
import { gt as _gt } from "./gt.js";
import { gte as _gte } from "./gte.js";
import { hasEIP1153 as _hasEIP1153 } from "./hasEIP1153.js";
import { hasEIP1559 as _hasEIP1559 } from "./hasEIP1559.js";
import { hasEIP3855 as _hasEIP3855 } from "./hasEIP3855.js";
import { hasEIP4844 as _hasEIP4844 } from "./hasEIP4844.js";
import { isAfter as _isAfter } from "./isAfter.js";
import { isAtLeast as _isAtLeast } from "./isAtLeast.js";
import { isBefore as _isBefore } from "./isBefore.js";
import { isPoS as _isPoS } from "./isPoS.js";
import { isPostMerge as _isPostMerge } from "./isPostMerge.js";
import { isValidName as _isValidName } from "./isValidName.js";
import { lt as _lt } from "./lt.js";
import { lte as _lte } from "./lte.js";
import { max as _max } from "./max.js";
import { min as _min } from "./min.js";
import { range as _range } from "./range.js";
import { supportsBlobs as _supportsBlobs } from "./supportsBlobs.js";
import { supportsEIP1559 as _supportsEIP1559 } from "./supportsEIP1559.js";
import { supportsPUSH0 as _supportsPUSH0 } from "./supportsPUSH0.js";
import { supportsTransientStorage as _supportsTransientStorage } from "./supportsTransientStorage.js";
import { toString as _toString } from "./toString.js";
export * from "./constants.js";
// Type definitions for all functions
export const fromString = _fromString;
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the function name in our API
export const toString = _toString;
export const isValidName = _isValidName;
export const isAtLeast = _isAtLeast;
export const isBefore = _isBefore;
export const isAfter = _isAfter;
export const compare = _compare;
export const min = _min;
export const max = _max;
export const gte = _gte;
export const lt = _lt;
export const gt = _gt;
export const equals = _equals;
export const lte = _lte;
export const hasEIP1559 = _hasEIP1559;
export const supportsEIP1559 = _supportsEIP1559;
export const hasEIP3855 = _hasEIP3855;
export const supportsPUSH0 = _supportsPUSH0;
export const hasEIP4844 = _hasEIP4844;
export const supportsBlobs = _supportsBlobs;
export const hasEIP1153 = _hasEIP1153;
export const supportsTransientStorage = _supportsTransientStorage;
export const isPostMerge = _isPostMerge;
export const isPoS = _isPoS;
export const allNames = _allNames;
export const allIds = _allIds;
export const range = _range;
// Namespace export
export const Hardfork = {
    fromString,
    toString,
    isValidName,
    isAtLeast,
    isBefore,
    isAfter,
    compare,
    min,
    max,
    gte,
    lt,
    gt,
    equals,
    lte,
    hasEIP1559,
    supportsEIP1559,
    hasEIP3855,
    supportsPUSH0,
    hasEIP4844,
    supportsBlobs,
    hasEIP1153,
    supportsTransientStorage,
    isPostMerge,
    isPoS,
    allNames,
    allIds,
    range,
};
