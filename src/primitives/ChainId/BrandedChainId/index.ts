// Export type definition
export type { BrandedChainId } from "./BrandedChainId.js";

// Export constants
export {
	MAINNET,
	GOERLI,
	SEPOLIA,
	HOLESKY,
	OPTIMISM,
	ARBITRUM,
	BASE,
	POLYGON,
} from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { equals as _equals } from "./equals.js";
import { isMainnet as _isMainnet } from "./isMainnet.js";

// Export constructors
export { from };

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

// Export internal functions (tree-shakeable)
export { _toNumber, _equals, _isMainnet };

// Export as namespace (convenience)
export const BrandedChainId = {
	from,
	toNumber,
	equals,
	isMainnet,
};
