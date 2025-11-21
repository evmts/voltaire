// Export type definition
export type { NetworkIdType } from "./NetworkIdType.js";

// Export constants
export { MAINNET, GOERLI, SEPOLIA, HOLESKY } from "./constants.js";

import { equals as _equals } from "./equals.js";
// Import all functions
import { from } from "./from.js";
import { toNumber as _toNumber } from "./toNumber.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toNumber(networkId: number): number {
	return _toNumber.call(from(networkId));
}

export function equals(networkId1: number, networkId2: number): boolean {
	return _equals.call(from(networkId1), from(networkId2));
}

// Export internal functions (tree-shakeable)
export { _toNumber, _equals };

// Export as namespace (convenience)
export const NetworkId = {
	from,
	toNumber,
	equals,
};
