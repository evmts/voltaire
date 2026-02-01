export { abs } from "./abs.js";
export { bitLength } from "./bitLength.js";
export { bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseNot } from "./bitwiseNot.js";
export { bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor } from "./bitwiseXor.js";
export { BITS, MAX, MIN, MODULO, NEG_ONE, ONE, SIZE, ZERO, } from "./constants.js";
export { dividedBy } from "./dividedBy.js";
export { equals } from "./equals.js";
export { from } from "./from.js";
export { fromBigInt } from "./fromBigInt.js";
export { fromBytes } from "./fromBytes.js";
export { fromHex } from "./fromHex.js";
export { fromNumber } from "./fromNumber.js";
export { greaterThan } from "./greaterThan.js";
export { isNegative } from "./isNegative.js";
export { isPositive } from "./isPositive.js";
export { isValid } from "./isValid.js";
export { isZero } from "./isZero.js";
export { leadingZeros } from "./leadingZeros.js";
export { lessThan } from "./lessThan.js";
export { maximum } from "./maximum.js";
export { minimum } from "./minimum.js";
export { minus } from "./minus.js";
export { modulo } from "./modulo.js";
export { negate } from "./negate.js";
export { plus } from "./plus.js";
export { popCount } from "./popCount.js";
export { shiftLeft } from "./shiftLeft.js";
export { shiftRight } from "./shiftRight.js";
export { sign } from "./sign.js";
export { times } from "./times.js";
export { toBigInt } from "./toBigInt.js";
export { toBytes } from "./toBytes.js";
export { toHex } from "./toHex.js";
export { toNumber } from "./toNumber.js";
export { toString } from "./toString.js";
import { abs } from "./abs.js";
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { BITS, MAX, MIN, MODULO, NEG_ONE, ONE, SIZE, ZERO, } from "./constants.js";
import { dividedBy } from "./dividedBy.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { greaterThan } from "./greaterThan.js";
import { isNegative } from "./isNegative.js";
import { isPositive } from "./isPositive.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { leadingZeros } from "./leadingZeros.js";
import { lessThan } from "./lessThan.js";
import { maximum } from "./maximum.js";
import { minimum } from "./minimum.js";
import { minus } from "./minus.js";
import { modulo } from "./modulo.js";
import { negate } from "./negate.js";
import { plus } from "./plus.js";
import { popCount } from "./popCount.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { sign } from "./sign.js";
import { times } from "./times.js";
import { toBigInt } from "./toBigInt.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
import { toString } from "./toString.js";
// Namespace export
export const Int256 = {
    from,
    fromHex,
    fromBigInt,
    fromNumber,
    fromBytes,
    isValid,
    toHex,
    toBigInt,
    toNumber,
    toBytes,
    toString,
    plus,
    minus,
    times,
    dividedBy,
    modulo,
    abs,
    negate,
    bitwiseAnd,
    bitwiseOr,
    bitwiseXor,
    bitwiseNot,
    shiftLeft,
    shiftRight,
    equals,
    lessThan,
    greaterThan,
    isZero,
    isNegative,
    isPositive,
    sign,
    minimum,
    maximum,
    bitLength,
    leadingZeros,
    popCount,
    MAX,
    MIN,
    ZERO,
    ONE,
    NEG_ONE,
    SIZE,
    BITS,
    MODULO,
};
