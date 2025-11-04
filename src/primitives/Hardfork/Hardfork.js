// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedHardfork.js";

import { allIds } from "./allIds.js";
import { allNames } from "./allNames.js";
import { compare } from "./compare.js";
import { eq } from "./eq.js";
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

// Export individual functions
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
	eq,
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

/**
 * @typedef {import('./BrandedHardfork.js').BrandedHardfork} BrandedHardfork
 */

/**
 * Factory function for creating Hardfork instances
 *
 * @param {string} value - Hardfork name
 * @returns {BrandedHardfork} Hardfork
 */
export function Hardfork(value) {
	return fromString(value);
}

Hardfork.fromString = fromString;
Hardfork.toString = toString;
Hardfork.isValidName = isValidName;
Hardfork.isAtLeast = isAtLeast;
Hardfork.isBefore = isBefore;
Hardfork.isAfter = isAfter;
Hardfork.isEqual = isEqual;
Hardfork.compare = compare;
Hardfork.min = min;
Hardfork.max = max;
Hardfork.gte = gte;
Hardfork.lt = lt;
Hardfork.gt = gt;
Hardfork.eq = eq;
Hardfork.lte = lte;
Hardfork.hasEIP1559 = hasEIP1559;
Hardfork.supportsEIP1559 = supportsEIP1559;
Hardfork.hasEIP3855 = hasEIP3855;
Hardfork.supportsPUSH0 = supportsPUSH0;
Hardfork.hasEIP4844 = hasEIP4844;
Hardfork.supportsBlobs = supportsBlobs;
Hardfork.hasEIP1153 = hasEIP1153;
Hardfork.supportsTransientStorage = supportsTransientStorage;
Hardfork.isPostMerge = isPostMerge;
Hardfork.isPoS = isPoS;
Hardfork.allNames = allNames;
Hardfork.allIds = allIds;
Hardfork.range = range;
