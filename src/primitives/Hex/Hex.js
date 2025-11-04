// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedHex.js";

import { from } from "./from.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBoolean } from "./fromBoolean.js";
import { fromBytes } from "./fromBytes.js";
import { fromNumber } from "./fromNumber.js";
import { fromString } from "./fromString.js";
import { toBigInt } from "./toBigInt.js";
import { toBoolean } from "./toBoolean.js";
import { toBytes } from "./toBytes.js";
import { toNumber } from "./toNumber.js";
import { toString } from "./toString.js";
import { assertSize } from "./assertSize.js";
import { concat } from "./concat.js";
import { equals } from "./equals.js";
import { isHex } from "./isHex.js";
import { isSized } from "./isSized.js";
import { pad } from "./pad.js";
import { padRight } from "./padRight.js";
import { random } from "./random.js";
import { size } from "./size.js";
import { slice } from "./slice.js";
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

/**
 * @typedef {import('./BrandedHex.js').BrandedHex} BrandedHex
 * @typedef {import('./HexConstructor.js').HexConstructor} HexConstructor
 */

/**
 * Factory function for creating Hex instances
 *
 * @type {HexConstructor}
 */
export function Hex(value) {
	return from(value);
}

Hex.from = function (value) {
	return from(value);
};
Hex.from.prototype = Hex.prototype;
Hex.fromBytes = function (value) {
	return fromBytes(value);
};
Hex.fromBytes.prototype = Hex.prototype;
Hex.fromNumber = function (value, size) {
	return fromNumber(value, size);
};
Hex.fromNumber.prototype = Hex.prototype;
Hex.fromBigInt = function (value, size) {
	return fromBigInt(value, size);
};
Hex.fromBigInt.prototype = Hex.prototype;
Hex.fromString = function (value) {
	return fromString(value);
};
Hex.fromString.prototype = Hex.prototype;
Hex.fromBoolean = function (value) {
	return fromBoolean(value);
};
Hex.fromBoolean.prototype = Hex.prototype;

// Static methods
Hex.isHex = isHex;
Hex.concat = concat;
Hex.random = random;
Hex.zero = zero;
Hex.validate = validate;

Hex.toBytes = toBytes;
Hex.toNumber = toNumber;
Hex.toBigInt = toBigInt;
Hex.toString = toString;
Hex.toBoolean = toBoolean;
Hex.size = size;
Hex.isSized = isSized;
Hex.assertSize = assertSize;
Hex.slice = slice;
Hex.pad = pad;
Hex.padRight = padRight;
Hex.trim = trim;
Hex.equals = equals;
Hex.xor = xor;

// Instance methods
Hex.prototype.toBytes = Function.prototype.call.bind(toBytes);
Hex.prototype.toNumber = Function.prototype.call.bind(toNumber);
Hex.prototype.toBigInt = Function.prototype.call.bind(toBigInt);
Hex.prototype.toString = Function.prototype.call.bind(toString);
Hex.prototype.toBoolean = Function.prototype.call.bind(toBoolean);
Hex.prototype.size = Function.prototype.call.bind(size);
Hex.prototype.isSized = Function.prototype.call.bind(isSized);
Hex.prototype.validate = Function.prototype.call.bind(validate);
Hex.prototype.assertSize = Function.prototype.call.bind(assertSize);
Hex.prototype.slice = Function.prototype.call.bind(slice);
Hex.prototype.pad = Function.prototype.call.bind(pad);
Hex.prototype.padRight = Function.prototype.call.bind(padRight);
Hex.prototype.trim = Function.prototype.call.bind(trim);
Hex.prototype.equals = Function.prototype.call.bind(equals);
Hex.prototype.xor = Function.prototype.call.bind(xor);
