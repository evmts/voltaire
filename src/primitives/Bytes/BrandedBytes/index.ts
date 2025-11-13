// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedBytes.js";

import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { concat } from "./concat.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromString } from "./fromString.js";
import { isEmpty } from "./isEmpty.js";
import { size } from "./size.js";
import { slice } from "./slice.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	from,
	fromHex,
	fromString,
	toHex,
	toString,
	concat,
	slice,
	equals,
	compare,
	size,
	clone,
	isEmpty,
	zero,
};

// Namespace export
export const BrandedBytes = {
	from,
	fromHex,
	fromString,
	toHex,
	toString,
	concat,
	slice,
	equals,
	compare,
	size,
	clone,
	isEmpty,
	zero,
};
