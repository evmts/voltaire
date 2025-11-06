// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedHex.js";

import { assertSize } from "./assertSize.js";
import { clone } from "./clone.js";
import { concat } from "./concat.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBoolean } from "./fromBoolean.js";
import { fromBytes } from "./fromBytes.js";
import { fromNumber } from "./fromNumber.js";
import { fromString } from "./fromString.js";
import { isHex } from "./isHex.js";
import { isSized } from "./isSized.js";
import { pad } from "./pad.js";
import { padRight } from "./padRight.js";
import { random } from "./random.js";
import { size } from "./size.js";
import { slice } from "./slice.js";
import { toBigInt } from "./toBigInt.js";
import { toBoolean } from "./toBoolean.js";
import { toBytes } from "./toBytes.js";
import { toNumber } from "./toNumber.js";
import { toString } from "./toString.js";
import { trim } from "./trim.js";
import { validate } from "./validate.js";
import { xor } from "./xor.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	from,
	fromBytes,
	fromNumber,
	fromBigInt,
	fromString,
	fromBoolean,
	toBytes,
	toNumber,
	toBigInt,
	toString,
	toBoolean,
	assertSize,
	clone,
	concat,
	equals,
	isHex,
	isSized,
	pad,
	padRight,
	random,
	size,
	slice,
	trim,
	validate,
	xor,
	zero,
};

// Namespace export
export const BrandedHex = {
	from,
	fromBytes,
	fromNumber,
	fromBigInt,
	fromString,
	fromBoolean,
	toBytes,
	toNumber,
	toBigInt,
	toString,
	toBoolean,
	assertSize,
	clone,
	concat,
	equals,
	isHex,
	isSized,
	pad,
	padRight,
	random,
	size,
	slice,
	trim,
	validate,
	xor,
	zero,
};
