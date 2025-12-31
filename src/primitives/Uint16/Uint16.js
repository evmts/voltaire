// @ts-nocheck
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
import { dividedBy } from "./dividedBy.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigint } from "./fromBigint.js";
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
import { toBigint } from "./toBigint.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: re-exporting toString for namespace
import { toString } from "./toString.js";

/**
 * @typedef {import('./Uint16Type.js').Uint16Type} Uint16Type
 */

/**
 * Create Uint16 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint16Type}
 *
 * @example
 * ```javascript
 * import { Uint16 } from '@tevm/voltaire';
 *
 * const a = Uint16(1000);
 * const b = Uint16("0x03e8");
 * ```
 */
export function Uint16(value) {
	return from(value);
}

// Static constructors
Uint16.from = from;
Uint16.fromHex = fromHex;
Uint16.fromBigint = fromBigint;
Uint16.fromNumber = fromNumber;
Uint16.fromBytes = fromBytes;

// Validation
Uint16.isValid = isValid;

// Conversions
Uint16.toHex = toHex;
Uint16.toBigint = toBigint;
Uint16.toNumber = toNumber;
Uint16.toBytes = toBytes;
Uint16.toString = toString;

// Arithmetic
Uint16.plus = plus;
Uint16.minus = minus;
Uint16.times = times;
Uint16.dividedBy = dividedBy;
Uint16.modulo = modulo;

// Bitwise
Uint16.bitwiseAnd = bitwiseAnd;
Uint16.bitwiseOr = bitwiseOr;
Uint16.bitwiseXor = bitwiseXor;
Uint16.bitwiseNot = bitwiseNot;
Uint16.shiftLeft = shiftLeft;
Uint16.shiftRight = shiftRight;

// Comparison
Uint16.equals = equals;
Uint16.lessThan = lessThan;
Uint16.greaterThan = greaterThan;
Uint16.isZero = isZero;
Uint16.minimum = minimum;
Uint16.maximum = maximum;

// Bit operations
Uint16.bitLength = bitLength;
Uint16.leadingZeros = leadingZeros;
Uint16.popCount = popCount;

// Constants
Uint16.MAX = MAX;
Uint16.MIN = MIN;
Uint16.ZERO = ZERO;
Uint16.ONE = ONE;
Uint16.SIZE = SIZE;
