/**
 * Hash Types and Utilities
 *
 * 32-byte hash values with encoding/decoding and comparison utilities.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Hash } from './Hash.js';
 *
 * // Factory function
 * const hash = Hash('0x1234...');
 *
 * // Static methods
 * const hex = Hash.toHex(hash);
 * const same = Hash.equals(hash, other);
 *
 * // Instance methods
 * const hex2 = hash.toHex();
 * const same2 = hash.equals(other);
 * ```
 */

// Import all method functions
import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { from as fromValue } from "./from.js";
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

// Re-export types and constants
export * from "./BrandedHash.js";

// Re-export method functions for tree-shaking
export {
	assert,
	clone,
	equals,
	format,
	fromBytes,
	fromHex,
	fromValue as from,
	isHash,
	isValidHex,
	isZero,
	keccak256,
	keccak256Hex,
	keccak256String,
	random,
	slice,
	toBytes,
	toHex,
	toString,
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
	return fromValue(value);
}

// Attach static methods - wrapped to set prototype without mutating originals
Hash.from = function (value) {
	return fromValue(value);
};
Hash.from.prototype = Hash.prototype;

Hash.fromBytes = function (value) {
	return fromBytes(value);
};
Hash.fromBytes.prototype = Hash.prototype;

Hash.fromHex = function (value) {
	return fromHex(value);
};
Hash.fromHex.prototype = Hash.prototype;
Hash.isHash = isHash;
Hash.isValidHex = isValidHex;
Hash.assert = assert;
Hash.keccak256 = keccak256;
Hash.keccak256String = keccak256String;
Hash.keccak256Hex = keccak256Hex;
Hash.random = random;

// Static methods that operate on Hash values
Hash.toBytes = toBytes;
Hash.toHex = toHex;
Hash.toString = toString;
Hash.equals = equals;
Hash.isZero = isZero;
Hash.clone = clone;
Hash.slice = slice;
Hash.format = format;

// Bind prototype methods using Function.prototype.call.bind
Hash.prototype.toBytes = Function.prototype.call.bind(toBytes);
Hash.prototype.toHex = Function.prototype.call.bind(toHex);
Hash.prototype.toString = Function.prototype.call.bind(toString);
Hash.prototype.equals = Function.prototype.call.bind(equals);
Hash.prototype.isZero = Function.prototype.call.bind(isZero);
Hash.prototype.clone = Function.prototype.call.bind(clone);
Hash.prototype.slice = Function.prototype.call.bind(slice);
Hash.prototype.format = Function.prototype.call.bind(format);
