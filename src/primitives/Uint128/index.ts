export type { Uint128Type } from "./Uint128Type.js";
export { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";

import type { Uint128Type } from "./Uint128Type.js";

import { bitLength as _bitLength } from "./bitLength.js";
import { bitwiseAnd as _bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseNot as _bitwiseNot } from "./bitwiseNot.js";
import { bitwiseOr as _bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor as _bitwiseXor } from "./bitwiseXor.js";
import { clone as _clone } from "./clone.js";
import { MAX, MIN, ONE, SIZE, ZERO } from "./constants.js";
import { dividedBy as _dividedBy } from "./dividedBy.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromAbiEncoded as _fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBigInt as _fromBigInt } from "./fromBigInt.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromNumber as _fromNumber } from "./fromNumber.js";
import { gcd as _gcd } from "./gcd.js";
import { greaterThan as _greaterThan } from "./greaterThan.js";
import { greaterThanOrEqual as _greaterThanOrEqual } from "./greaterThanOrEqual.js";
import { isPowerOf2 as _isPowerOf2 } from "./isPowerOf2.js";
import { isValid as _isValid } from "./isValid.js";
import { isZero as _isZero } from "./isZero.js";
import { lcm as _lcm } from "./lcm.js";
import { leadingZeros as _leadingZeros } from "./leadingZeros.js";
import { lessThan as _lessThan } from "./lessThan.js";
import { lessThanOrEqual as _lessThanOrEqual } from "./lessThanOrEqual.js";
import { max as _max } from "./max.js";
import { maximum as _maximum } from "./maximum.js";
import { min as _min } from "./min.js";
import { minimum as _minimum } from "./minimum.js";
import { minus as _minus } from "./minus.js";
import { modulo as _modulo } from "./modulo.js";
import { notEquals as _notEquals } from "./notEquals.js";
import { plus as _plus } from "./plus.js";
import { popCount as _popCount } from "./popCount.js";
import { product as _product } from "./product.js";
import { shiftLeft as _shiftLeft } from "./shiftLeft.js";
import { shiftRight as _shiftRight } from "./shiftRight.js";
import { sum as _sum } from "./sum.js";
import { times as _times } from "./times.js";
import { toAbiEncoded as _toAbiEncoded } from "./toAbiEncoded.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { toPower as _toPower } from "./toPower.js";
import { toString as _toString } from "./toString.js";
import { tryFrom as _tryFrom } from "./tryFrom.js";

// Typed re-exports
export const from: (value: bigint | number | string) => Uint128Type = _from;
export const fromHex: (hex: string) => Uint128Type = _fromHex;
export const fromBigInt: (value: bigint) => Uint128Type = _fromBigInt;
export const fromNumber: (value: number) => Uint128Type = _fromNumber;
export const fromBytes: (bytes: Uint8Array) => Uint128Type = _fromBytes;
export const fromAbiEncoded: (bytes: Uint8Array) => Uint128Type =
	_fromAbiEncoded;
export const tryFrom: (value: bigint | number | string) => Uint128Type | null =
	_tryFrom;
export const isValid: (value: bigint | number | string) => boolean = _isValid;

export const toHex: (uint: Uint128Type) => string = _toHex;
export const toBigInt: (uint: Uint128Type) => bigint = _toBigInt;
export const toNumber: (uint: Uint128Type) => number = _toNumber;
export const toBytes: (uint: Uint128Type) => Uint8Array = _toBytes;
export const toAbiEncoded: (uint: Uint128Type) => Uint8Array = _toAbiEncoded;
export const toString: (uint: Uint128Type, radix?: number) => string = _toString;

export const clone: (uint: Uint128Type) => Uint128Type = _clone;

export const plus: (uint: Uint128Type, b: Uint128Type) => Uint128Type = _plus;
export const minus: (uint: Uint128Type, b: Uint128Type) => Uint128Type = _minus;
export const times: (uint: Uint128Type, b: Uint128Type) => Uint128Type = _times;
export const dividedBy: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_dividedBy;
export const modulo: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_modulo;
export const toPower: (uint: Uint128Type, exponent: Uint128Type) => Uint128Type =
	_toPower;

export const bitwiseAnd: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_bitwiseAnd;
export const bitwiseOr: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_bitwiseOr;
export const bitwiseXor: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_bitwiseXor;
export const bitwiseNot: (uint: Uint128Type) => Uint128Type = _bitwiseNot;
export const shiftLeft: (uint: Uint128Type, bits: number) => Uint128Type =
	_shiftLeft;
export const shiftRight: (uint: Uint128Type, bits: number) => Uint128Type =
	_shiftRight;

export const equals: (uint: Uint128Type, b: Uint128Type) => boolean = _equals;
export const notEquals: (uint: Uint128Type, b: Uint128Type) => boolean =
	_notEquals;
export const lessThan: (uint: Uint128Type, b: Uint128Type) => boolean =
	_lessThan;
export const lessThanOrEqual: (uint: Uint128Type, b: Uint128Type) => boolean =
	_lessThanOrEqual;
export const greaterThan: (uint: Uint128Type, b: Uint128Type) => boolean =
	_greaterThan;
export const greaterThanOrEqual: (
	uint: Uint128Type,
	b: Uint128Type,
) => boolean = _greaterThanOrEqual;
export const isZero: (uint: Uint128Type) => boolean = _isZero;

export const minimum: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_minimum;
export const maximum: (uint: Uint128Type, b: Uint128Type) => Uint128Type =
	_maximum;

export const bitLength: (uint: Uint128Type) => number = _bitLength;
export const leadingZeros: (uint: Uint128Type) => number = _leadingZeros;
export const popCount: (uint: Uint128Type) => number = _popCount;

export const sum: (values: Uint128Type[]) => Uint128Type = _sum;
export const product: (values: Uint128Type[]) => Uint128Type = _product;
export const min: (values: Uint128Type[]) => Uint128Type = _min;
export const max: (values: Uint128Type[]) => Uint128Type = _max;

export const gcd: (a: Uint128Type, b: Uint128Type) => Uint128Type = _gcd;
export const lcm: (a: Uint128Type, b: Uint128Type) => Uint128Type = _lcm;
export const isPowerOf2: (uint: Uint128Type) => boolean = _isPowerOf2;

// Namespace export
export const BrandedUint128 = {
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
	notEquals,
	lessThan,
	lessThanOrEqual,
	greaterThan,
	greaterThanOrEqual,
	isZero,
	minimum,
	maximum,
	bitLength,
	leadingZeros,
	popCount,
	sum,
	product,
	min,
	max,
	gcd,
	lcm,
	isPowerOf2,
	MAX,
	MIN,
	ZERO,
	ONE,
	SIZE,
} as const;
