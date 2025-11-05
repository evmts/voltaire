// @ts-nocheck
export * from "./BrandedHash.js";
export * from "./constants.js";

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

/**
 * @typedef {import('./BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./HashConstructor.js').HashConstructor} HashConstructor
 */

/**
 * Factory function for creating Hash instances
 *
 * @type {HashConstructor}
 */
export function Hash(value) {
	return from(value);
}

Hash.from = (value) => from(value);
Hash.from.prototype = Hash.prototype;
Hash.fromBytes = (value) => fromBytes(value);
Hash.fromBytes.prototype = Hash.prototype;
Hash.fromHex = (value) => fromHex(value);
Hash.fromHex.prototype = Hash.prototype;

Hash.isHash = isHash;
Hash.isValidHex = isValidHex;
Hash.assert = assert;
Hash.keccak256 = keccak256;
Hash.keccak256String = keccak256String;
Hash.keccak256Hex = keccak256Hex;
Hash.random = random;

Hash.toBytes = toBytes;
Hash.toHex = toHex;
Hash.toString = toString;
Hash.equals = equals;
Hash.isZero = isZero;
Hash.clone = clone;
Hash.slice = slice;
Hash.format = format;

Hash.ZERO = ZERO;
Hash.SIZE = SIZE;

Hash.prototype.toBytes = Function.prototype.call.bind(toBytes);
Hash.prototype.toHex = Function.prototype.call.bind(toHex);
Hash.prototype.toString = Function.prototype.call.bind(toString);
Hash.prototype.equals = Function.prototype.call.bind(equals);
Hash.prototype.isZero = Function.prototype.call.bind(isZero);
Hash.prototype.clone = Function.prototype.call.bind(clone);
Hash.prototype.slice = Function.prototype.call.bind(slice);
Hash.prototype.format = Function.prototype.call.bind(format);
