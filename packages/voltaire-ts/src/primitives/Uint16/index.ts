export * from "./constants.js";
export * from "./Uint16Type.js";

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
import { minusChecked } from "./minusChecked.js";
import { minusWrapping } from "./minusWrapping.js";
import { modulo } from "./modulo.js";
import { plus } from "./plus.js";
import { plusChecked } from "./plusChecked.js";
import { plusWrapping } from "./plusWrapping.js";
import { popCount } from "./popCount.js";
import { shiftLeft } from "./shiftLeft.js";
import { shiftRight } from "./shiftRight.js";
import { times } from "./times.js";
import { timesChecked } from "./timesChecked.js";
import { timesWrapping } from "./timesWrapping.js";
import { toBigint } from "./toBigint.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: re-exporting toString for namespace
import { toString } from "./toString.js";

export {
	bitLength,
	bitwiseAnd,
	bitwiseNot,
	bitwiseOr,
	bitwiseXor,
	dividedBy,
	equals,
	from,
	fromBigint,
	fromBytes,
	fromHex,
	fromNumber,
	greaterThan,
	isValid,
	isZero,
	leadingZeros,
	lessThan,
	maximum,
	minimum,
	minus,
	minusChecked,
	minusWrapping,
	modulo,
	plus,
	plusChecked,
	plusWrapping,
	popCount,
	shiftLeft,
	shiftRight,
	times,
	timesChecked,
	timesWrapping,
	toBigint,
	toBytes,
	toHex,
	toNumber,
	toString,
};

export const Uint16Type = {
	from,
	fromHex,
	fromBigint,
	fromNumber,
	fromBytes,
	isValid,
	toHex,
	toBigint,
	toNumber,
	toBytes,
	toString,
	plus,
	minus,
	times,
	plusChecked,
	minusChecked,
	timesChecked,
	plusWrapping,
	minusWrapping,
	timesWrapping,
	dividedBy,
	modulo,
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
