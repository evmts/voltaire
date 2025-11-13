export * from "./BrandedUint64.js";
export * from "./constants.js";

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

export {
	from,
	fromHex,
	fromBigInt,
	fromNumber,
	fromBytes,
	fromAbiEncoded,
	tryFrom,
	isValid,
	toHex,
	toBigInt,
	toNumber,
	toBytes,
	toAbiEncoded,
	toString,
	clone,
	plus,
	minus,
	times,
	dividedBy,
	modulo,
	toPower,
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
	minimum,
	maximum,
	bitLength,
	leadingZeros,
	popCount,
};

export const Uint64 = {
	from,
	fromHex,
	fromBigInt,
	fromNumber,
	fromBytes,
	fromAbiEncoded,
	tryFrom,
	isValid,
	toHex,
	toBigInt,
	toNumber,
	toBytes,
	toAbiEncoded,
	toString,
	clone,
	plus,
	minus,
	times,
	dividedBy,
	modulo,
	toPower,
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
	minimum,
	maximum,
	bitLength,
	leadingZeros,
	popCount,
	MAX,
	MIN,
	ZERO,
	ONE,
	SIZE,
};
