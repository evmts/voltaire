// Export type definition
export type { ChainIdType } from "./ChainIdType.js";

// Export constants
export {
	ARBITRUM,
	BASE,
	GOERLI,
	HOLESKY,
	MAINNET,
	OPTIMISM,
	POLYGON,
	SEPOLIA,
} from "./constants.js";

// Export known chains data
export { KNOWN_CHAINS, CHAIN_NAMES } from "./knownChains.js";

import { equals as _equals } from "./equals.js";
// Import all functions
import { from } from "./from.js";
import { fromStrict } from "./fromStrict.js";
import { getName as _getName } from "./getName.js";
import { isKnown as _isKnown } from "./isKnown.js";
import { isMainnet as _isMainnet } from "./isMainnet.js";
import { toNumber as _toNumber } from "./toNumber.js";

// Export constructors
export { from, fromStrict };

// Export public wrapper functions
export function toNumber(chainId: number): number {
	return _toNumber.call(from(chainId));
}

export function equals(chainId1: number, chainId2: number): boolean {
	return _equals.call(from(chainId1), from(chainId2));
}

export function isMainnet(chainId: number): boolean {
	return _isMainnet.call(from(chainId));
}

export function isKnown(chainId: number): boolean {
	return _isKnown.call(from(chainId));
}

export function getName(chainId: number): string | undefined {
	return _getName.call(from(chainId));
}

// Export internal functions (tree-shakeable)
export { _toNumber, _equals, _isMainnet, _isKnown, _getName };

// Export as namespace (convenience)
export const ChainId = {
	from,
	fromStrict,
	toNumber,
	equals,
	isMainnet,
	isKnown,
	getName,
};
