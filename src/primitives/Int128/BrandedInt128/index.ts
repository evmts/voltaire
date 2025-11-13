// @ts-nocheck
export * from "./BrandedInt128.js";
export * from "./constants.js";

import { abs } from "./abs.js";
import { bitLength } from "./bitLength.js";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import {
	BITS,
	MAX,
	MIN,
	MODULO,
	NEG_ONE,
	ONE,
	SIZE,
	ZERO,
} from "./constants.js";
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
import { toString } from "./toString.js";

// Export individual functions
export {
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
};

// Namespace export
export const BrandedInt128 = {
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
