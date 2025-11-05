// @ts-nocheck
export * from "./constants.js";
export * from "./BrandedHash.js";

import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { SIZE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { isZero } from "./isZero.js";
import { keccak256 } from "./keccak256.js";
import { keccak256Hex } from "./keccak256Hex.js";
import { keccak256String } from "./keccak256String.js";
import { random } from "./random.js";
import { slice } from "./slice.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";

// Export individual functions
export {
	from,
	fromBytes,
	fromHex,
	isHash,
	isValidHex,
	assert,
	keccak256,
	keccak256String,
	keccak256Hex,
	random,
	toBytes,
	toHex,
	toString,
	equals,
	isZero,
	clone,
	slice,
	format,
};

// Namespace export
export const BrandedHash = {
	from,
	fromBytes,
	fromHex,
	isHash,
	isValidHex,
	assert,
	keccak256,
	keccak256String,
	keccak256Hex,
	random,
	toBytes,
	toHex,
	toString,
	equals,
	isZero,
	clone,
	slice,
	format,
	SIZE,
	ZERO,
};
