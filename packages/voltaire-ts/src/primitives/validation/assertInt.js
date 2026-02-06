import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "../errors/index.js";

// Signed integer bounds
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

/**
 * Assert value is valid int8 (-128 to 127)
 *
 * @param {number} value - Value to check
 * @param {string} [name='int8'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -128
 * @throws {IntegerOverflowError} If value > 127
 * @example
 * ```javascript
 * assertInt8(100);      // OK
 * assertInt8(-100);     // OK
 * assertInt8(128);      // throws IntegerOverflowError
 * assertInt8(-129);     // throws IntegerUnderflowError
 * ```
 */
export function assertInt8(value, name = "int8") {
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

/**
 * Assert value is valid int16 (-32768 to 32767)
 *
 * @param {number} value - Value to check
 * @param {string} [name='int16'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -32768
 * @throws {IntegerOverflowError} If value > 32767
 */
export function assertInt16(value, name = "int16") {
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

/**
 * Assert value is valid int32 (-2147483648 to 2147483647)
 *
 * @param {number} value - Value to check
 * @param {string} [name='int32'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2147483648
 * @throws {IntegerOverflowError} If value > 2147483647
 */
export function assertInt32(value, name = "int32") {
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

/**
 * Assert value is valid int64 (-2^63 to 2^63-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='int64'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2^63
 * @throws {IntegerOverflowError} If value > 2^63-1
 */
export function assertInt64(value, name = "int64") {
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

/**
 * Assert value is valid int128 (-2^127 to 2^127-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='int128'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2^127
 * @throws {IntegerOverflowError} If value > 2^127-1
 */
export function assertInt128(value, name = "int128") {
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

/**
 * Assert value is valid int256 (-2^255 to 2^255-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='int256'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2^255
 * @throws {IntegerOverflowError} If value > 2^255-1
 */
export function assertInt256(value, name = "int256") {
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
