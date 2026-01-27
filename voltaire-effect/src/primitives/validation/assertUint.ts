import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "@tevm/voltaire/errors";

const UINT8_MAX = 255;
const UINT16_MAX = 65535;
const UINT32_MAX = 4294967295;
const UINT64_MAX = 18446744073709551615n;
const UINT128_MAX = 340282366920938463463374607431768211455n;
const UINT256_MAX =
	115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export function assertUint8(value: number, name = "uint8"): void {
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

export function assertUint16(value: number, name = "uint16"): void {
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

export function assertUint32(value: number, name = "uint32"): void {
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

export function assertUint64(value: bigint, name = "uint64"): void {
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

export function assertUint128(value: bigint, name = "uint128"): void {
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

export function assertUint256(value: bigint, name = "uint256"): void {
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
