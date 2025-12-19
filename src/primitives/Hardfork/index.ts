import type { HardforkType } from "./HardforkType.js";

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

// Re-export type
export type { HardforkType } from "./HardforkType.js";
export * from "./constants.js";

// Type definitions for all functions
export const fromString: (name: string) => HardforkType | undefined =
	_fromString;
export const toString: (fork: HardforkType) => string = _toString;
export const isValidName: (name: string) => boolean = _isValidName;
export const isAtLeast: (fork: HardforkType, minFork: HardforkType) => boolean =
	_isAtLeast;
export const isBefore: (fork: HardforkType, maxFork: HardforkType) => boolean =
	_isBefore;
export const isAfter: (fork: HardforkType, minFork: HardforkType) => boolean =
	_isAfter;
export const compare: (a: HardforkType, b: HardforkType) => number = _compare;
export const min: (forks: HardforkType[]) => HardforkType = _min;
export const max: (forks: HardforkType[]) => HardforkType = _max;
export const gte: (a: HardforkType, b: HardforkType) => boolean = _gte;
export const lt: (a: HardforkType, b: HardforkType) => boolean = _lt;
export const gt: (a: HardforkType, b: HardforkType) => boolean = _gt;
export const equals: (a: HardforkType, b: HardforkType) => boolean = _equals;
export const lte: (a: HardforkType, b: HardforkType) => boolean = _lte;
export const hasEIP1559: (fork: HardforkType) => boolean = _hasEIP1559;
export const supportsEIP1559: (fork: HardforkType) => boolean =
	_supportsEIP1559;
export const hasEIP3855: (fork: HardforkType) => boolean = _hasEIP3855;
export const supportsPUSH0: (fork: HardforkType) => boolean = _supportsPUSH0;
export const hasEIP4844: (fork: HardforkType) => boolean = _hasEIP4844;
export const supportsBlobs: (fork: HardforkType) => boolean = _supportsBlobs;
export const hasEIP1153: (fork: HardforkType) => boolean = _hasEIP1153;
export const supportsTransientStorage: (fork: HardforkType) => boolean =
	_supportsTransientStorage;
export const isPostMerge: (fork: HardforkType) => boolean = _isPostMerge;
export const isPoS: (fork: HardforkType) => boolean = _isPoS;
export const allNames: () => string[] = _allNames;
export const allIds: () => HardforkType[] = _allIds;
export const range: (start: HardforkType, end: HardforkType) => HardforkType[] =
	_range;

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
