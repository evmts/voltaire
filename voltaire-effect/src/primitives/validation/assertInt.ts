import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "@tevm/voltaire/errors";

const INT8_MIN = -128;
const INT8_MAX = 127;
const INT16_MIN = -32768;
const INT16_MAX = 32767;
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;
const INT128_MIN = -170141183460469231731687303715884105728n;
const INT128_MAX = 170141183460469231731687303715884105727n;
const INT256_MIN =
	-57896044618658097711785492504343953926634992332820282019728792003956564819968n;
const INT256_MAX =
	57896044618658097711785492504343953926634992332820282019728792003956564819967n;

export function assertInt8(value: number, name = "int8"): void {
	if (value < INT8_MIN) {
		throw new IntegerUnderflowError(`${name} below minimum (-128)`, {
			value,
			min: INT8_MIN,
			type: name,
		});
	}
	if (value > INT8_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (127)`, {
			value,
			max: INT8_MAX,
			type: name,
		});
	}
}

export function assertInt16(value: number, name = "int16"): void {
	if (value < INT16_MIN) {
		throw new IntegerUnderflowError(`${name} below minimum (-32768)`, {
			value,
			min: INT16_MIN,
			type: name,
		});
	}
	if (value > INT16_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (32767)`, {
			value,
			max: INT16_MAX,
			type: name,
		});
	}
}

export function assertInt32(value: number, name = "int32"): void {
	if (value < INT32_MIN) {
		throw new IntegerUnderflowError(`${name} below minimum (-2147483648)`, {
			value,
			min: INT32_MIN,
			type: name,
		});
	}
	if (value > INT32_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2147483647)`, {
			value,
			max: INT32_MAX,
			type: name,
		});
	}
}

export function assertInt64(value: bigint, name = "int64"): void {
	if (value < INT64_MIN) {
		throw new IntegerUnderflowError(`${name} below minimum (-2^63)`, {
			value,
			min: INT64_MIN,
			type: name,
		});
	}
	if (value > INT64_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2^63-1)`, {
			value,
			max: INT64_MAX,
			type: name,
		});
	}
}

export function assertInt128(value: bigint, name = "int128"): void {
	if (value < INT128_MIN) {
		throw new IntegerUnderflowError(`${name} below minimum (-2^127)`, {
			value,
			min: INT128_MIN,
			type: name,
		});
	}
	if (value > INT128_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2^127-1)`, {
			value,
			max: INT128_MAX,
			type: name,
		});
	}
}

export function assertInt256(value: bigint, name = "int256"): void {
	if (value < INT256_MIN) {
		throw new IntegerUnderflowError(`${name} below minimum (-2^255)`, {
			value,
			min: INT256_MIN,
			type: name,
		});
	}
	if (value > INT256_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2^255-1)`, {
			value,
			max: INT256_MAX,
			type: name,
		});
	}
}
