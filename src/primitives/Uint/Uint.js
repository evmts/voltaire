/**
 * Uint (256-bit Unsigned Integer) Factory and Utilities
 *
 * Complete Uint256 implementation with type safety.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Uint } from './Uint.js';
 *
 * // Factory function
 * const uint = Uint(100n);
 *
 * // Static methods
 * const bytes = Uint.toBytes(uint);
 * const hex = Uint.toHex(uint);
 *
 * // Instance methods
 * const bytes2 = uint.toBytes();
 * const hex2 = uint.toHex();
 * ```
 */

// Import all method functions
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { dividedBy } from "./dividedBy.js";
import { equals } from "./equals.js";
import { from as fromValue } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { greaterThan } from "./greaterThan.js";
import { greaterThanOrEqual } from "./greaterThanOrEqual.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { leadingZeros } from "./leadingZeros.js";
import { lessThan } from "./lessThan.js";
import { lessThanOrEqual } from "./lessThanOrEqual.js";
import { maximum } from "./maximum.js";
import { minimum } from "./minimum.js";
import { minus } from "./minus.js";
import { modulo } from "./modulo.js";
import { notEquals } from "./notEquals.js";
import { plus } from "./plus.js";
import { popCount } from "./popCount.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { times } from "./times.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toBigInt } from "./toBigInt.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
import { toPower } from "./toPower.js";
import { toString } from "./toString.js";
import { tryFrom } from "./tryFrom.js";

// Re-export types
export * from "./BrandedUint.js";
export * from "./constants.js";

// Re-export method functions for tree-shaking
export {
	bitLength,
	bitwiseAnd,
	bitwiseNot,
	bitwiseOr,
	bitwiseXor,
	dividedBy,
	equals,
	fromAbiEncoded,
	fromBigInt,
	fromBytes,
	fromHex,
	fromNumber,
	fromValue as from,
	greaterThan,
	greaterThanOrEqual,
	isValid,
	isZero,
	leadingZeros,
	lessThan,
	lessThanOrEqual,
	maximum,
	minimum,
	minus,
	modulo,
	notEquals,
	plus,
	popCount,
	shiftLeft,
	shiftRight,
	times,
	toAbiEncoded,
	toBigInt,
	toBytes,
	toHex,
	toNumber,
	toPower,
	toString,
	tryFrom,
};

/**
 * @typedef {import('./BrandedUint.js').BrandedUint} BrandedUint
 * @typedef {import('./UintConstructor.js').UintConstructor} UintConstructor
 */

/**
 * Factory function for creating Uint instances
 *
 * @type {UintConstructor}
 */
export function Uint(value) {
	return fromValue(value);
}

// Attach static methods - wrapped to set prototype without mutating originals
Uint.from = function (value) {
	return fromValue(value);
};
Uint.from.prototype = Uint.prototype;

Uint.fromHex = function (value) {
	return fromHex(value);
};
Uint.fromHex.prototype = Uint.prototype;

Uint.fromBigInt = function (value) {
	return fromBigInt(value);
};
Uint.fromBigInt.prototype = Uint.prototype;

Uint.fromNumber = function (value) {
	return fromNumber(value);
};
Uint.fromNumber.prototype = Uint.prototype;

Uint.fromBytes = function (value) {
	return fromBytes(value);
};
Uint.fromBytes.prototype = Uint.prototype;

Uint.fromAbiEncoded = function (value) {
	return fromAbiEncoded(value);
};
Uint.fromAbiEncoded.prototype = Uint.prototype;
Uint.tryFrom = tryFrom;
Uint.isValid = isValid;

// Static methods that operate on Uint values
Uint.toHex = toHex;
Uint.toBigInt = toBigInt;
Uint.toNumber = toNumber;
Uint.toBytes = toBytes;
Uint.toAbiEncoded = toAbiEncoded;
Uint.toString = toString;
Uint.plus = plus;
Uint.minus = minus;
Uint.times = times;
Uint.dividedBy = dividedBy;
Uint.modulo = modulo;
Uint.toPower = toPower;
Uint.bitwiseAnd = bitwiseAnd;
Uint.bitwiseOr = bitwiseOr;
Uint.bitwiseXor = bitwiseXor;
Uint.bitwiseNot = bitwiseNot;
Uint.shiftLeft = shiftLeft;
Uint.shiftRight = shiftRight;
Uint.equals = equals;
Uint.notEquals = notEquals;
Uint.lessThan = lessThan;
Uint.lessThanOrEqual = lessThanOrEqual;
Uint.greaterThan = greaterThan;
Uint.greaterThanOrEqual = greaterThanOrEqual;
Uint.isZero = isZero;
Uint.minimum = minimum;
Uint.maximum = maximum;
Uint.bitLength = bitLength;
Uint.leadingZeros = leadingZeros;
Uint.popCount = popCount;

// Bind prototype methods using Function.prototype.call.bind
Uint.prototype.toHex = Function.prototype.call.bind(toHex);
Uint.prototype.toBigInt = Function.prototype.call.bind(toBigInt);
Uint.prototype.toNumber = Function.prototype.call.bind(toNumber);
Uint.prototype.toBytes = Function.prototype.call.bind(toBytes);
Uint.prototype.toAbiEncoded = Function.prototype.call.bind(toAbiEncoded);
Uint.prototype.toString = Function.prototype.call.bind(toString);
Uint.prototype.plus = Function.prototype.call.bind(plus);
Uint.prototype.minus = Function.prototype.call.bind(minus);
Uint.prototype.times = Function.prototype.call.bind(times);
Uint.prototype.dividedBy = Function.prototype.call.bind(dividedBy);
Uint.prototype.modulo = Function.prototype.call.bind(modulo);
Uint.prototype.toPower = Function.prototype.call.bind(toPower);
Uint.prototype.bitwiseAnd = Function.prototype.call.bind(bitwiseAnd);
Uint.prototype.bitwiseOr = Function.prototype.call.bind(bitwiseOr);
Uint.prototype.bitwiseXor = Function.prototype.call.bind(bitwiseXor);
Uint.prototype.bitwiseNot = Function.prototype.call.bind(bitwiseNot);
Uint.prototype.shiftLeft = Function.prototype.call.bind(shiftLeft);
Uint.prototype.shiftRight = Function.prototype.call.bind(shiftRight);
Uint.prototype.equals = Function.prototype.call.bind(equals);
Uint.prototype.notEquals = Function.prototype.call.bind(notEquals);
Uint.prototype.lessThan = Function.prototype.call.bind(lessThan);
Uint.prototype.lessThanOrEqual = Function.prototype.call.bind(lessThanOrEqual);
Uint.prototype.greaterThan = Function.prototype.call.bind(greaterThan);
Uint.prototype.greaterThanOrEqual = Function.prototype.call.bind(greaterThanOrEqual);
Uint.prototype.isZero = Function.prototype.call.bind(isZero);
Uint.prototype.minimum = Function.prototype.call.bind(minimum);
Uint.prototype.maximum = Function.prototype.call.bind(maximum);
Uint.prototype.bitLength = Function.prototype.call.bind(bitLength);
Uint.prototype.leadingZeros = Function.prototype.call.bind(leadingZeros);
Uint.prototype.popCount = Function.prototype.call.bind(popCount);
