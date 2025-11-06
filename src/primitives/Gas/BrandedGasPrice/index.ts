// Export type definition
export type { BrandedGasPrice } from "./BrandedGasPrice.js";

// Import all functions
import { from } from "./from.js";
import { fromGwei } from "./fromGwei.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toGwei as _toGwei } from "./toGwei.js";

// Export constructors
export { from, fromGwei };

// Export public wrapper functions
export function toBigInt(value: number | bigint | string): bigint {
	return _toBigInt.call(from(value));
}

export function toGwei(value: number | bigint | string): bigint {
	return _toGwei.call(from(value));
}

// Export internal functions (tree-shakeable)
export { _toBigInt, _toGwei };

// Export as namespace (convenience)
export const GasPrice = {
	from,
	fromGwei,
	toBigInt,
	toGwei,
};
