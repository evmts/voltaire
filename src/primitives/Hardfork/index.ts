// @ts-nocheck
import { allIds } from "./allIds.js";
import { allNames } from "./allNames.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { fromString } from "./fromString.js";
import { gt } from "./gt.js";
import { gte } from "./gte.js";
import { hasEIP1153 } from "./hasEIP1153.js";
import { hasEIP1559 } from "./hasEIP1559.js";
import { hasEIP3855 } from "./hasEIP3855.js";
import { hasEIP4844 } from "./hasEIP4844.js";
import { isAfter } from "./isAfter.js";
import { isAtLeast } from "./isAtLeast.js";
import { isBefore } from "./isBefore.js";
import { isEqual } from "./isEqual.js";
import { isPoS } from "./isPoS.js";
import { isPostMerge } from "./isPostMerge.js";
import { isValidName } from "./isValidName.js";
import { lt } from "./lt.js";
import { lte } from "./lte.js";
import { max } from "./max.js";
import { min } from "./min.js";
import { range } from "./range.js";
import { supportsBlobs } from "./supportsBlobs.js";
import { supportsEIP1559 } from "./supportsEIP1559.js";
import { supportsPUSH0 } from "./supportsPUSH0.js";
import { supportsTransientStorage } from "./supportsTransientStorage.js";
import { toString } from "./toString.js";

// Re-export type
export type { HardforkType } from "./HardforkType.js";
export * from "./constants.js";

// Re-export individual functions for direct import
export {
	fromString,
	toString,
	isValidName,
	isAtLeast,
	isBefore,
	isAfter,
	isEqual,
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

// Namespace export
export const Hardfork = {
	fromString,
	toString,
	isValidName,
	isAtLeast,
	isBefore,
	isAfter,
	isEqual,
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
