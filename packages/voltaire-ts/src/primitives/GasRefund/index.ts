// Export type definition
export type { GasRefundType } from "./GasRefundType.js";

// Import all functions
import { cappedRefund as _cappedRefund } from "./cappedRefund.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";

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

export function cappedRefund(
	refund: number | bigint | string,
	gasUsed: bigint,
) {
	return _cappedRefund.call(from(refund), gasUsed);
}

// Export internal functions (tree-shakeable)
export { _toNumber, _toBigInt, _toHex, _equals, _cappedRefund };

// Export as namespace (convenience)
export const GasRefund = {
	from,
	toNumber,
	toBigInt,
	toHex,
	equals,
	cappedRefund,
};
