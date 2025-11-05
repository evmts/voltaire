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

// Import types
import type { UintConstructor } from "./UintConstructor.js";

// Import constants
import { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";

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
 * Factory function for creating Uint instances
 */
export const Uint = ((value: bigint | number | string) => {
	return fromValue(value);
}) as UintConstructor;

// Initialize prototype
Uint.prototype = {} as any;

// Attach constants
Uint.MAX = MAX;
Uint.MIN = MIN;
Uint.ZERO = ZERO;
Uint.ONE = ONE;
Uint.SIZE = SIZE;

// Attach static methods
Uint.from = fromValue;
Uint.fromHex = fromHex;
Uint.fromBigInt = fromBigInt;
Uint.fromNumber = fromNumber;
Uint.fromBytes = fromBytes;
Uint.fromAbiEncoded = fromAbiEncoded;
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
Uint.prototype.toHex = Function.prototype.call.bind(toHex) as any;
Uint.prototype.toBigInt = Function.prototype.call.bind(toBigInt) as any;
Uint.prototype.toNumber = Function.prototype.call.bind(toNumber) as any;
Uint.prototype.toBytes = Function.prototype.call.bind(toBytes) as any;
Uint.prototype.toAbiEncoded = Function.prototype.call.bind(toAbiEncoded) as any;
Uint.prototype.toString = Function.prototype.call.bind(toString) as any;
Uint.prototype.plus = Function.prototype.call.bind(plus) as any;
Uint.prototype.minus = Function.prototype.call.bind(minus) as any;
Uint.prototype.times = Function.prototype.call.bind(times) as any;
Uint.prototype.dividedBy = Function.prototype.call.bind(dividedBy) as any;
Uint.prototype.modulo = Function.prototype.call.bind(modulo) as any;
Uint.prototype.toPower = Function.prototype.call.bind(toPower) as any;
Uint.prototype.bitwiseAnd = Function.prototype.call.bind(bitwiseAnd) as any;
Uint.prototype.bitwiseOr = Function.prototype.call.bind(bitwiseOr) as any;
Uint.prototype.bitwiseXor = Function.prototype.call.bind(bitwiseXor) as any;
Uint.prototype.bitwiseNot = Function.prototype.call.bind(bitwiseNot) as any;
Uint.prototype.shiftLeft = Function.prototype.call.bind(shiftLeft) as any;
Uint.prototype.shiftRight = Function.prototype.call.bind(shiftRight) as any;
Uint.prototype.equals = Function.prototype.call.bind(equals) as any;
Uint.prototype.notEquals = Function.prototype.call.bind(notEquals) as any;
Uint.prototype.lessThan = Function.prototype.call.bind(lessThan) as any;
Uint.prototype.lessThanOrEqual = Function.prototype.call.bind(
	lessThanOrEqual,
) as any;
Uint.prototype.greaterThan = Function.prototype.call.bind(greaterThan) as any;
Uint.prototype.greaterThanOrEqual = Function.prototype.call.bind(
	greaterThanOrEqual,
) as any;
Uint.prototype.isZero = Function.prototype.call.bind(isZero) as any;
Uint.prototype.minimum = Function.prototype.call.bind(minimum) as any;
Uint.prototype.maximum = Function.prototype.call.bind(maximum) as any;
Uint.prototype.bitLength = Function.prototype.call.bind(bitLength) as any;
Uint.prototype.leadingZeros = Function.prototype.call.bind(leadingZeros) as any;
Uint.prototype.popCount = Function.prototype.call.bind(popCount) as any;
