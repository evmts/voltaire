// @ts-nocheck
import * as BrandedHash from "./BrandedHash/index.js";

// Re-export constants
export * from "./BrandedHash/constants.js";

/**
 * @typedef {import('./BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 */

/**
 * Factory function for creating Hash instances
 */
export function Hash(value) {
	const result = BrandedHash.from(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
}

// Static constructors
Hash.from = (value) => {
	const result = BrandedHash.from(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

Hash.fromBytes = (value) => {
	const result = BrandedHash.fromBytes(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

Hash.fromHex = (value) => {
	const result = BrandedHash.fromHex(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

// Static utility methods
Hash.isHash = BrandedHash.isHash;
Hash.isValidHex = BrandedHash.isValidHex;
Hash.assert = BrandedHash.assert;
Hash.keccak256 = (value) => {
	const result = BrandedHash.keccak256(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.keccak256String = (value) => {
	const result = BrandedHash.keccak256String(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.keccak256Hex = (value) => {
	const result = BrandedHash.keccak256Hex(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.random = () => {
	const result = BrandedHash.random();
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.toBytes = BrandedHash.toBytes;
Hash.toHex = BrandedHash.toHex;
Hash.toString = BrandedHash.toString;
Hash.equals = BrandedHash.equals;
Hash.isZero = BrandedHash.isZero;
Hash.clone = (value) => {
	const result = BrandedHash.clone(value);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.slice = (value, start, end) => {
	const result = BrandedHash.slice(value, start, end);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.format = BrandedHash.format;
Hash.concat = (...hashes) => {
	const result = BrandedHash.concat(...hashes);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.merkleRoot = (hashes) => {
	const result = BrandedHash.merkleRoot(hashes);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};

Hash.ZERO = BrandedHash.ZERO;
Hash.SIZE = BrandedHash.SIZE;

// Set up Hash.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Hash.prototype, Uint8Array.prototype);

// Instance methods
Hash.prototype.toBytes = function () {
	return BrandedHash.toBytes(this);
};
Hash.prototype.toHex = function () {
	return BrandedHash.toHex(this);
};
Hash.prototype.toString = function () {
	return BrandedHash.toString(this);
};
Hash.prototype.equals = function (other) {
	return BrandedHash.equals(this, other);
};
Hash.prototype.isZero = function () {
	return BrandedHash.isZero(this);
};
Hash.prototype.clone = function () {
	const result = BrandedHash.clone(this);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.prototype.slice = function (start, end) {
	const result = BrandedHash.slice(this, start, end);
	Object.setPrototypeOf(result, Hash.prototype);
	return result;
};
Hash.prototype.format = function () {
	return BrandedHash.format(this);
};
