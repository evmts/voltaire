export type { ChainIdType } from "./ChainIdType.js";
export { ARBITRUM, BASE, GOERLI, HOLESKY, KNOWN_CHAINS, MAINNET, OPTIMISM, POLYGON, SEPOLIA, } from "./constants.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { getChainName as _getChainName } from "./getChainName.js";
import { isKnownChain as _isKnownChain } from "./isKnownChain.js";
import { isMainnet as _isMainnet } from "./isMainnet.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { from };
export declare function toNumber(chainId: number): number;
export declare function equals(chainId1: number, chainId2: number): boolean;
export declare function isMainnet(chainId: number): boolean;
export declare function isKnownChain(chainId: number): boolean;
export declare function getChainName(chainId: number): string | undefined;
export { _toNumber, _equals, _isMainnet, _isKnownChain, _getChainName };
export declare const ChainId: {
    from: typeof from;
    toNumber: typeof toNumber;
    equals: typeof equals;
    isMainnet: typeof isMainnet;
    isKnownChain: typeof isKnownChain;
    getChainName: typeof getChainName;
};
//# sourceMappingURL=index.d.ts.map