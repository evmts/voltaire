// Export constants
export { ARBITRUM, BASE, GOERLI, HOLESKY, KNOWN_CHAINS, MAINNET, OPTIMISM, POLYGON, SEPOLIA, } from "./constants.js";
import { equals as _equals } from "./equals.js";
// Import all functions
import { from } from "./from.js";
import { getChainName as _getChainName } from "./getChainName.js";
import { isKnownChain as _isKnownChain } from "./isKnownChain.js";
import { isMainnet as _isMainnet } from "./isMainnet.js";
import { toNumber as _toNumber } from "./toNumber.js";
// Export constructors
export { from };
// Export public wrapper functions
export function toNumber(chainId) {
    return _toNumber.call(from(chainId));
}
export function equals(chainId1, chainId2) {
    return _equals.call(from(chainId1), from(chainId2));
}
export function isMainnet(chainId) {
    return _isMainnet.call(from(chainId));
}
export function isKnownChain(chainId) {
    return _isKnownChain(from(chainId));
}
export function getChainName(chainId) {
    return _getChainName(from(chainId));
}
// Export internal functions (tree-shakeable)
export { _toNumber, _equals, _isMainnet, _isKnownChain, _getChainName };
// Export as namespace (convenience)
export const ChainId = {
    from,
    toNumber,
    equals,
    isMainnet,
    isKnownChain,
    getChainName,
};
