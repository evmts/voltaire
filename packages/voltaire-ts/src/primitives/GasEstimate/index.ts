// Export type definition
export type { GasEstimateType } from "./GasEstimateType.js";

// Import all functions
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toGasLimit as _toGasLimit } from "./toGasLimit.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { withBuffer as _withBuffer } from "./withBuffer.js";

// Export constructor
export { from };

// Export public wrapper functions
export function toNumber(value: number | bigint | string): number {
	return _toNumber.call(from(value));
}

export function toBigInt(value: number | bigint | string): bigint {
	return _toBigInt.call(from(value));
}

export function toHex(value: number | bigint | string): string {
	return _toHex.call(from(value));
}

export function equals(
	value1: number | bigint | string,
	value2: number | bigint | string,
): boolean {
	return _equals.call(from(value1), from(value2));
}

export function compare(
	value1: number | bigint | string,
	value2: number | bigint | string,
): number {
	return _compare.call(from(value1), from(value2));
}

export function withBuffer(
	estimate: number | bigint | string,
	percentageBuffer: number,
) {
	return _withBuffer.call(from(estimate), percentageBuffer);
}

export function toGasLimit(estimate: number | bigint | string): bigint {
	return _toGasLimit.call(from(estimate));
}

// Export internal functions (tree-shakeable)
export {
	_toNumber,
	_toBigInt,
	_toHex,
	_equals,
	_compare,
	_withBuffer,
	_toGasLimit,
};

// Export as namespace (convenience)
export const GasEstimate = {
	from,
	toNumber,
	toBigInt,
	toHex,
	equals,
	compare,
	withBuffer,
	toGasLimit,
};
