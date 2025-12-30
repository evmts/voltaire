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
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
import { toString } from "./toString.js";

/**
 * @typedef {import('./Uint8Type.js').Uint8Type} Uint8Type
 */

/**
 * Create Uint8 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint8Type}
 *
 * @example
 * ```javascript
 * import { Uint8 } from '@tevm/voltaire';
 *
 * const a = Uint8(42);
 * const b = Uint8("0x2a");
 * const c = Uint8(42n);
 * ```
 */
export function Uint8(value) {
	return from(value);
}

// Static constructors
Uint8.from = from;
Uint8.fromHex = fromHex;
Uint8.fromBigint = fromBigint;
Uint8.fromNumber = fromNumber;
Uint8.fromBytes = fromBytes;

// Validation
Uint8.isValid = isValid;

// Conversions
Uint8.toHex = toHex;
Uint8.toBigint = toBigint;
Uint8.toNumber = toNumber;
Uint8.toBytes = toBytes;
Uint8.toString = toString;

// Arithmetic
Uint8.plus = plus;
Uint8.minus = minus;
Uint8.times = times;
Uint8.dividedBy = dividedBy;
Uint8.modulo = modulo;

// Bitwise
Uint8.bitwiseAnd = bitwiseAnd;
Uint8.bitwiseOr = bitwiseOr;
Uint8.bitwiseXor = bitwiseXor;
Uint8.bitwiseNot = bitwiseNot;
Uint8.shiftLeft = shiftLeft;
Uint8.shiftRight = shiftRight;

// Comparison
Uint8.equals = equals;
Uint8.lessThan = lessThan;
Uint8.greaterThan = greaterThan;
Uint8.isZero = isZero;
Uint8.minimum = minimum;
Uint8.maximum = maximum;

// Bit operations
Uint8.bitLength = bitLength;
Uint8.leadingZeros = leadingZeros;
Uint8.popCount = popCount;

// Constants
Uint8.MAX = MAX;
Uint8.MIN = MIN;
Uint8.ZERO = ZERO;
Uint8.ONE = ONE;
Uint8.SIZE = SIZE;
