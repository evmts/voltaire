// @ts-nocheck
import * as HashType from "./BrandedHashIndex.js";

// Re-export constants
export * from "./constants.js";

/**
 * @typedef {import(./HashType.js').HashType} HashType
 */

/**
 * Creates a Hash instance from a string or Uint8Array.
 * Canonical constructor for the Hash Class API.
 *
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
	const result = HashType.from(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
}

// Static constructors
/**
 * Alias for Hash() constructor.
 * Prefer using Hash() directly.
 */
Hash.from = (value) => {
	const result = HashType.from(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

Hash.fromBytes = (value) => {
	const result = HashType.fromBytes(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

Hash.fromHex = (value) => {
	const result = HashType.fromHex(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

// Static utility methods
Hash.isHash = HashType.isHash;
Hash.isValidHex = HashType.isValidHex;
Hash.assert = HashType.assert;
Hash.keccak256 = (value) => {
	const result = HashType.keccak256(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.keccak256String = (value) => {
	const result = HashType.keccak256String(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.keccak256Hex = (value) => {
	const result = HashType.keccak256Hex(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.random = () => {
	const result = HashType.random();
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.toBytes = HashType.toBytes;
Hash.toHex = HashType.toHex;
Hash.toString = HashType.toString;
Hash.equals = HashType.equals;
Hash.isZero = HashType.isZero;
Hash.clone = (value) => {
	const result = HashType.clone(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.slice = (value, start, end) => {
	const result = HashType.slice(value, start, end);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.format = HashType.format;
Hash.concat = (...hashes) => {
	const result = HashType.concat(...hashes);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.merkleRoot = (hashes) => {
	const result = HashType.merkleRoot(hashes);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

// Wrap ZERO constant with prototype
const _ZERO = HashType.ZERO;
Object.setPrototypeOf(_ZERO, Hash.prototype);
Hash.ZERO = _ZERO;

Hash.SIZE = HashType.SIZE;

// Set up Hash.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Hash.prototype, Uint8Array.prototype);

// Instance methods
Hash.prototype.toBytes = function () {
	return HashType.toBytes(this);
};
Hash.prototype.toString = function () {
	return HashType.toString(this);
};
Hash.prototype.equals = function (other) {
	return HashType.equals(this, other);
};
Hash.prototype.isZero = function () {
	return HashType.isZero(this);
};
Hash.prototype.clone = function () {
	const result = HashType.clone(this);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.prototype.slice = function (start, end) {
	const result = HashType.slice(this, start, end);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.prototype.format = function () {
	return HashType.format(this);
};
