// Export type definition
export type { EffectiveGasPriceType } from "./EffectiveGasPriceType.js";

// Import internal functions
import { calculate } from "./calculate.js";
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { fromGwei } from "./fromGwei.js";
import { fromWei } from "./fromWei.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toGwei as _toGwei } from "./toGwei.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { toWei as _toWei } from "./toWei.js";

// Export constructors (no wrapper needed)
export { from, fromGwei, fromWei, calculate };

// Export public wrapper functions
export function toGwei(effectivePrice: bigint | number | string): bigint {
	return _toGwei.call(from(effectivePrice));
}

export function toWei(effectivePrice: bigint | number | string): bigint {
	return _toWei.call(from(effectivePrice));
}

export function toNumber(effectivePrice: bigint | number | string): number {
	return _toNumber.call(from(effectivePrice));
}

export function toBigInt(effectivePrice: bigint | number | string): bigint {
	return _toBigInt.call(from(effectivePrice));
}

export function equals(
	effectivePrice1: bigint | number | string,
	effectivePrice2: bigint | number | string,
): boolean {
	return _equals.call(from(effectivePrice1), from(effectivePrice2));
}

export function compare(
	effectivePrice1: bigint | number | string,
	effectivePrice2: bigint | number | string,
): number {
	return _compare.call(from(effectivePrice1), from(effectivePrice2));
}

// Export internal functions (tree-shakeable)
export { _toGwei, _toWei, _toNumber, _toBigInt, _equals, _compare };

// Export as namespace (convenience)
export const EffectiveGasPrice = {
	from,
	fromGwei,
	fromWei,
	calculate,
	toGwei,
	toWei,
	toNumber,
	toBigInt,
	equals,
	compare,
};
