export * from "./BytesType.js";
export * from "./errors.js";

import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { concat } from "./concat.js";
import { constantTimeEquals } from "./constantTimeEquals.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { fromString } from "./fromString.js";
import { isBytes } from "./isBytes.js";
import { isEmpty } from "./isEmpty.js";
import { padLeft } from "./padLeft.js";
import { padRight } from "./padRight.js";
import { random } from "./random.js";
import { size } from "./size.js";
import { slice } from "./slice.js";
import { toBigInt } from "./toBigInt.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
import { toString } from "./toString.js";
import { trimLeft } from "./trimLeft.js";
import { trimRight } from "./trimRight.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	assert,
	clone,
	compare,
	concat,
	constantTimeEquals,
	equals,
	from,
	fromBigInt,
	fromHex,
	fromNumber,
	fromString,
	isBytes,
	isEmpty,
	padLeft,
	padRight,
	random,
	size,
	slice,
	toBigInt,
	toHex,
	toNumber,
	toString,
	trimLeft,
	trimRight,
	zero,
};

// Namespace export
export const BytesType = {
	assert,
	clone,
	compare,
	concat,
	constantTimeEquals,
	equals,
	from,
	fromBigInt,
	fromHex,
	fromNumber,
	fromString,
	isBytes,
	isEmpty,
	padLeft,
	padRight,
	random,
	size,
	slice,
	toBigInt,
	toHex,
	toNumber,
	toString,
	trimLeft,
	trimRight,
	zero,
};
