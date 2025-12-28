// @ts-nocheck
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { clone } from "./clone.js";
import { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
import { dividedBy } from "./dividedBy.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { greaterThan } from "./greaterThan.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { leadingZeros } from "./leadingZeros.js";
import { lessThan } from "./lessThan.js";
import { maximum } from "./maximum.js";
import { minimum } from "./minimum.js";
import { minus } from "./minus.js";
import { modulo } from "./modulo.js";
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

/**
 * @typedef {import('./Uint32Type.js').Uint32Type} Uint32Type
 */

/**
 * Create Uint32 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint32Type}
 *
 * @example
 * ```javascript
 * import { Uint32 } from '@tevm/voltaire';
 *
 * const a = Uint32(100000);
 * const b = Uint32("0x186a0");
 * ```
 */
export function Uint32(value) {
	return from(value);
}

// Static constructors
Uint32.from = from;
Uint32.fromHex = fromHex;
Uint32.fromBigInt = fromBigInt;
Uint32.fromNumber = fromNumber;
Uint32.fromBytes = fromBytes;
Uint32.fromAbiEncoded = fromAbiEncoded;
Uint32.tryFrom = tryFrom;

// Validation
Uint32.isValid = isValid;

// Conversions
Uint32.toHex = toHex;
Uint32.toBigInt = toBigInt;
Uint32.toNumber = toNumber;
Uint32.toBytes = toBytes;
Uint32.toAbiEncoded = toAbiEncoded;
Uint32.toString = toString;

// Utilities
Uint32.clone = clone;

// Arithmetic
Uint32.plus = plus;
Uint32.minus = minus;
Uint32.times = times;
Uint32.dividedBy = dividedBy;
Uint32.modulo = modulo;
Uint32.toPower = toPower;

// Bitwise
Uint32.bitwiseAnd = bitwiseAnd;
Uint32.bitwiseOr = bitwiseOr;
Uint32.bitwiseXor = bitwiseXor;
Uint32.bitwiseNot = bitwiseNot;
Uint32.shiftLeft = shiftLeft;
Uint32.shiftRight = shiftRight;

// Comparison
Uint32.equals = equals;
Uint32.lessThan = lessThan;
Uint32.greaterThan = greaterThan;
Uint32.isZero = isZero;
Uint32.minimum = minimum;
Uint32.maximum = maximum;

// Bit operations
Uint32.bitLength = bitLength;
Uint32.leadingZeros = leadingZeros;
Uint32.popCount = popCount;

// Constants
Uint32.MAX = MAX;
Uint32.MIN = MIN;
Uint32.ZERO = ZERO;
Uint32.ONE = ONE;
Uint32.SIZE = SIZE;
