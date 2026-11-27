import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";
import { assert } from "./assert.js";
import { clone } from "./clone.js";
import { Concat } from "./concat.js";
import { SIZE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isHash } from "./isHash.js";
import { isValidHex } from "./isValidHex.js";
import { isZero } from "./isZero.js";
import { Keccak256 } from "./keccak256.js";
import { Keccak256Hex } from "./keccak256Hex.js";
import { Keccak256String } from "./keccak256String.js";
import { MerkleRoot } from "./merkleRoot.js";
import { random } from "./random.js";
import { slice } from "./slice.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the canonical name for this conversion
import { toString } from "./toString.js";

// Re-export constants
export * from "./constants.js";

/**
 * @typedef {import('./HashType.js').HashType} HashType
 * @typedef {import('./HashType.js').HashLike} HashLike
 */

/** @type {(data: Uint8Array) => HashType} */
const _keccak256 = Keccak256({ keccak256: keccak256Impl });
/** @type {(hex: string) => HashType} */
const _keccak256Hex = Keccak256Hex({ keccak256: keccak256Impl });
/** @type {(str: string) => HashType} */
const _keccak256String = Keccak256String({ keccak256: keccak256Impl });
/** @type {(leaves: HashType[]) => HashType} */
const _merkleRoot = MerkleRoot({ keccak256: keccak256Impl });
/** @type {(...hashes: HashType[]) => HashType} */
const _concat = Concat({ keccak256: keccak256Impl });

/**
 * Creates a Hash instance from a string or Uint8Array.
 * Canonical constructor for the Hash Class API.
 *
 * @param {string | Uint8Array} value
 * @returns {HashType}
 * @example
 * ```typescript
 * // Using constructor (recommended)
 * const hash = Hash("0x1234...");
 *
 * // Namespace API (for functional style)
 * import * as Hash from './Hash/index.js';
 * const hash = Hash.from("0x1234...");
 * ```
 */
export function Hash(value) {
	const result = from(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
}

// Static constructors
/**
 * Alias for Hash() constructor.
 * Prefer using Hash() directly.
 * @param {string | Uint8Array} value
 * @returns {HashType}
 */
Hash.from = (value) => {
	const result = from(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

/**
 * @param {Uint8Array} value
 * @returns {HashType}
 */
Hash.fromBytes = (value) => {
	const result = fromBytes(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

/**
 * @param {string} value
 * @returns {HashType}
 */
Hash.fromHex = (value) => {
	const result = fromHex(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

// Static utility methods
Hash.isHash = isHash;
Hash.isValidHex = isValidHex;
Hash.assert = assert;
/**
 * @param {Uint8Array} value
 * @returns {HashType}
 */
Hash.keccak256 = (value) => {
	const result = _keccak256(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
/**
 * @param {string} value
 * @returns {HashType}
 */
Hash.keccak256String = (value) => {
	const result = _keccak256String(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
/**
 * @param {string} value
 * @returns {HashType}
 */
Hash.keccak256Hex = (value) => {
	const result = _keccak256Hex(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.random = () => {
	const result = random();
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.toBytes = toBytes;
Hash.toHex = toHex;
Hash.toString = toString;
Hash.equals = equals;
Hash.isZero = isZero;
/**
 * @param {HashType} value
 * @returns {HashType}
 */
Hash.clone = (value) => {
	const result = clone(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
/**
 * @param {HashType} value
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Uint8Array}
 */
Hash.slice = (value, start, end) => {
	const result = slice(value, start, end);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.format = format;
/**
 * @param {...HashType} hashes
 * @returns {HashType}
 */
Hash.concat = (...hashes) => {
	const result = _concat(...hashes);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
/**
 * @param {HashType[]} hashes
 * @returns {HashType}
 */
Hash.merkleRoot = (hashes) => {
	const result = _merkleRoot(hashes);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

// Wrap ZERO constant with prototype
const _ZERO = ZERO;
Object.setPrototypeOf(_ZERO, Hash.prototype);
Hash.ZERO = _ZERO;

Hash.SIZE = SIZE;

// Set up Hash.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Hash.prototype, Uint8Array.prototype);

// Instance methods
Hash.prototype.toBytes = /** @this {HashType} */ function () {
	return toBytes(this);
};
Hash.prototype.toString = /** @this {HashType} */ function () {
	return toString(this);
};
Hash.prototype.equals =
	/**
	 * @this {HashType}
	 * @param {HashType} other
	 */
	function (other) {
		return equals(this, other);
	};
Hash.prototype.isZero = /** @this {HashType} */ function () {
	return isZero(this);
};
Hash.prototype.clone = /** @this {HashType} */ function () {
	const result = clone(this);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.prototype.slice =
	/**
	 * @this {HashType}
	 * @param {number} [start]
	 * @param {number} [end]
	 */
	function (start, end) {
		const result = slice(this, start, end);
		Object.setPrototypeOf(result, Hash.prototype);
		return result;
	};
Hash.prototype.format = /** @this {HashType} */ function () {
	return format(this);
};
