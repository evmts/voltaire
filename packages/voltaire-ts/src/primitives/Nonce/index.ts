// Export type definition
export type { NonceType } from "./NonceType.js";

// Import all functions
import { from } from "./from.js";
import { increment as _increment } from "./increment.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toNumber as _toNumber } from "./toNumber.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toNumber(nonce: number | bigint | string): number {
	return _toNumber.call(from(nonce));
}

export function toBigInt(nonce: number | bigint | string): bigint {
	return _toBigInt.call(from(nonce));
}

export function increment(nonce: number | bigint | string) {
	return _increment.call(from(nonce));
}

// Export internal functions (tree-shakeable)
export { _toNumber, _toBigInt, _increment };

// Export as callable constructor and namespace
export const Nonce = Object.assign(from, {
	from,
	toNumber,
	toBigInt,
	increment,
});
