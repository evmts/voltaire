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
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is standard API name
import { toString } from "./toString.js";
import { tryFrom } from "./tryFrom.js";

/**
 * @typedef {import('./Uint64Type.js').Uint64Type} Uint64Type
 */

/**
 * Create Uint64 from various input types (callable constructor)
 *
 * @param {number | bigint | string} value - Number, BigInt, or hex string
 * @returns {Uint64Type}
 *
 * @example
 * ```javascript
 * import { Uint64 } from '@tevm/voltaire';
 *
 * const a = Uint64(1000000000000n);
 * const b = Uint64("0xe8d4a51000");
 * ```
 */
export function Uint64(value) {
	return from(value);
}

// Static constructors
Uint64.from = from;
Uint64.fromHex = fromHex;
Uint64.fromBigInt = fromBigInt;
Uint64.fromNumber = fromNumber;
Uint64.fromBytes = fromBytes;
Uint64.fromAbiEncoded = fromAbiEncoded;
Uint64.tryFrom = tryFrom;

// Validation
Uint64.isValid = isValid;

// Conversions
Uint64.toHex = toHex;
Uint64.toBigInt = toBigInt;
Uint64.toNumber = toNumber;
Uint64.toBytes = toBytes;
Uint64.toAbiEncoded = toAbiEncoded;
Uint64.toString = toString;

// Utilities
Uint64.clone = clone;

// Arithmetic
Uint64.plus = plus;
Uint64.minus = minus;
Uint64.times = times;
Uint64.dividedBy = dividedBy;
Uint64.modulo = modulo;
Uint64.toPower = toPower;

// Bitwise
Uint64.bitwiseAnd = bitwiseAnd;
Uint64.bitwiseOr = bitwiseOr;
Uint64.bitwiseXor = bitwiseXor;
Uint64.bitwiseNot = bitwiseNot;
Uint64.shiftLeft = shiftLeft;
Uint64.shiftRight = shiftRight;

// Comparison
Uint64.equals = equals;
Uint64.lessThan = lessThan;
Uint64.greaterThan = greaterThan;
Uint64.isZero = isZero;
Uint64.minimum = minimum;
Uint64.maximum = maximum;

// Bit operations
Uint64.bitLength = bitLength;
Uint64.leadingZeros = leadingZeros;
Uint64.popCount = popCount;

// Constants
Uint64.MAX = MAX;
Uint64.MIN = MIN;
Uint64.ZERO = ZERO;
Uint64.ONE = ONE;
Uint64.SIZE = SIZE;
