// Export type definition
export type { BrandedGasLimit } from "./BrandedGasLimit.js";

// Export constants
export { SIMPLE_TRANSFER, ERC20_TRANSFER, DEFAULT_LIMIT } from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toNumber as _toNumber } from "./toNumber.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toBigInt(value: number | bigint | string): bigint {
	return _toBigInt.call(from(value));
}

export function toNumber(value: number | bigint | string): number {
	return _toNumber.call(from(value));
}

// Export internal functions (tree-shakeable)
export { _toBigInt, _toNumber };

// Export as namespace (convenience)
export const GasLimit = {
	from,
	toBigInt,
	toNumber,
};
