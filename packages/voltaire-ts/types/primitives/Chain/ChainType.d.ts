/**
 * Native currency metadata for an EVM chain
 */
export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
    [key: string]: unknown;
}
/**
 * Block explorer metadata for an EVM chain
 */
export interface Explorer {
    name: string;
    url: string;
    standard?: string;
    [key: string]: unknown;
}
/**
 * EVM chain configuration object (EIP-155 / chainlist schema)
 */
export interface Chain {
    name: string;
    chain: string;
    chainId: number;
    networkId?: number;
    shortName: string;
    rpc: string[];
    nativeCurrency: NativeCurrency;
    infoURL?: string;
    explorers?: Explorer[];
    [key: string]: unknown;
}
//# sourceMappingURL=ChainType.d.ts.map