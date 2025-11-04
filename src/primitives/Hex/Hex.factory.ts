/**
 * Hex (Hexadecimal) Types and Utilities
 *
 * Complete hex encoding/decoding with type safety.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Hex } from './Hex.js';
 *
 * // Factory function
 * const hex = Hex('0x1234');
 *
 * // Static methods
 * const bytes = Hex.toBytes(hex);
 * const num = Hex.toNumber(hex);
 *
 * // Instance methods
 * const bytes2 = hex.toBytes();
 * const num2 = hex.toNumber();
 * ```
 */

// Import types
import type { HexConstructor } from "./HexConstructor.js";

// Import all method functions
import { assertSize } from "./assertSize.js";
import { concat } from "./concat.js";
import { equals } from "./equals.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBoolean } from "./fromBoolean.js";
import { fromBytes } from "./fromBytes.js";
import { from as fromValue } from "./from.js";
import { fromNumber } from "./fromNumber.js";
import { fromString } from "./fromString.js";
import { isHex } from "./isHex.js";
import { isSized } from "./isSized.js";
import { pad } from "./pad.js";
import { padRight } from "./padRight.js";
import { random } from "./random.js";
import { size } from "./size.js";
import { slice } from "./slice.js";
import { toBigInt } from "./toBigInt.js";
import { toBoolean } from "./toBoolean.js";
import { toBytes } from "./toBytes.js";
import { toNumber } from "./toNumber.js";
import { toString } from "./toString.js";
import { trim } from "./trim.js";
import { validate } from "./validate.js";
import { xor } from "./xor.js";
import { zero } from "./zero.js";

// Re-export types
export * from "./BrandedHex.js";
export * from "./errors.js";

// Re-export method functions for tree-shaking
export {
	assertSize,
	concat,
	equals,
	fromBigInt,
	fromBoolean,
	fromBytes,
	fromNumber,
	fromString,
	fromValue as from,
	isHex,
	isSized,
	pad,
	padRight,
	random,
	size,
	slice,
	toBigInt,
	toBoolean,
	toBytes,
	toNumber,
	toString,
	trim,
	validate,
	xor,
	zero,
};

/**
 * Factory function for creating Hex instances
 */
export const Hex = ((value: string | Uint8Array) => {
	return fromValue(value);
}) as HexConstructor;

// Initialize prototype
Hex.prototype = {} as any;

// Attach static methods
Hex.from = fromValue;
Hex.fromBytes = fromBytes;
Hex.fromNumber = fromNumber;
Hex.fromBigInt = fromBigInt;
Hex.fromString = fromString;
Hex.fromBoolean = fromBoolean;
Hex.isHex = isHex;
Hex.concat = concat;
Hex.random = random;
Hex.zero = zero;
Hex.validate = validate;

// Static methods that operate on Hex values
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

// Bind prototype methods using Function.prototype.call.bind
Hex.prototype.toBytes = Function.prototype.call.bind(toBytes) as any;
Hex.prototype.toNumber = Function.prototype.call.bind(toNumber) as any;
Hex.prototype.toBigInt = Function.prototype.call.bind(toBigInt) as any;
Hex.prototype.toString = Function.prototype.call.bind(toString) as any;
Hex.prototype.toBoolean = Function.prototype.call.bind(toBoolean) as any;
Hex.prototype.size = Function.prototype.call.bind(size) as any;
Hex.prototype.isSized = Function.prototype.call.bind(isSized) as any;
Hex.prototype.validate = Function.prototype.call.bind(validate) as any;
Hex.prototype.assertSize = Function.prototype.call.bind(assertSize) as any;
Hex.prototype.slice = Function.prototype.call.bind(slice) as any;
Hex.prototype.pad = Function.prototype.call.bind(pad) as any;
Hex.prototype.padRight = Function.prototype.call.bind(padRight) as any;
Hex.prototype.trim = Function.prototype.call.bind(trim) as any;
Hex.prototype.equals = Function.prototype.call.bind(equals) as any;
Hex.prototype.xor = Function.prototype.call.bind(xor) as any;
