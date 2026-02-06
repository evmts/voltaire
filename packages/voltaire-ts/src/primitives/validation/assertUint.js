import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "../errors/index.js";

// Unsigned integer maximums
const UINT8_MAX = 255;
const UINT16_MAX = 65535;
const UINT32_MAX = 4294967295;
const UINT64_MAX = 18446744073709551615n;
const UINT128_MAX = 340282366920938463463374607431768211455n;
const UINT256_MAX =
	115792089237316195423570985008687907853269984665640564039457584007913129639935n;

/**
 * Assert value is valid uint8 (0-255)
 *
 * @param {number} value - Value to check
 * @param {string} [name='uint8'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 255
 * @example
 * ```javascript
 * assertUint8(100);     // OK
 * assertUint8(256);     // throws IntegerOverflowError
 * assertUint8(-1);      // throws IntegerUnderflowError
 * ```
 */
export function assertUint8(value, name = "uint8") {
	if (value < 0) {
		throw new IntegerUnderflowError(`${name} cannot be negative`, {
			value,
			min: 0,
			type: name,
		});
	}
	if (value > UINT8_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (255)`, {
			value,
			max: UINT8_MAX,
			type: name,
		});
	}
}

/**
 * Assert value is valid uint16 (0-65535)
 *
 * @param {number} value - Value to check
 * @param {string} [name='uint16'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 65535
 */
export function assertUint16(value, name = "uint16") {
	if (value < 0) {
		throw new IntegerUnderflowError(`${name} cannot be negative`, {
			value,
			min: 0,
			type: name,
		});
	}
	if (value > UINT16_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (65535)`, {
			value,
			max: UINT16_MAX,
			type: name,
		});
	}
}

/**
 * Assert value is valid uint32 (0-4294967295)
 *
 * @param {number} value - Value to check
 * @param {string} [name='uint32'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 4294967295
 */
export function assertUint32(value, name = "uint32") {
	if (value < 0) {
		throw new IntegerUnderflowError(`${name} cannot be negative`, {
			value,
			min: 0,
			type: name,
		});
	}
	if (value > UINT32_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (4294967295)`, {
			value,
			max: UINT32_MAX,
			type: name,
		});
	}
}

/**
 * Assert value is valid uint64 (0 to 2^64-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='uint64'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 2^64-1
 */
export function assertUint64(value, name = "uint64") {
	if (value < 0n) {
		throw new IntegerUnderflowError(`${name} cannot be negative`, {
			value,
			min: 0n,
			type: name,
		});
	}
	if (value > UINT64_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2^64-1)`, {
			value,
			max: UINT64_MAX,
			type: name,
		});
	}
}

/**
 * Assert value is valid uint128 (0 to 2^128-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='uint128'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 2^128-1
 */
export function assertUint128(value, name = "uint128") {
	if (value < 0n) {
		throw new IntegerUnderflowError(`${name} cannot be negative`, {
			value,
			min: 0n,
			type: name,
		});
	}
	if (value > UINT128_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2^128-1)`, {
			value,
			max: UINT128_MAX,
			type: name,
		});
	}
}

/**
 * Assert value is valid uint256 (0 to 2^256-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='uint256'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 2^256-1
 */
export function assertUint256(value, name = "uint256") {
	if (value < 0n) {
		throw new IntegerUnderflowError(`${name} cannot be negative`, {
			value,
			min: 0n,
			type: name,
		});
	}
	if (value > UINT256_MAX) {
		throw new IntegerOverflowError(`${name} exceeds maximum (2^256-1)`, {
			value,
			max: UINT256_MAX,
			type: name,
		});
	}
}
