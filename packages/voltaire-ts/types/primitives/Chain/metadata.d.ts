/**
 * Chain metadata for popular chains
 * Includes hardfork info, block times, gas limits, and L2 classifications
 */
export type Hardfork = "chainstart" | "homestead" | "dao" | "tangerineWhistle" | "spuriousDragon" | "byzantium" | "constantinople" | "petersburg" | "istanbul" | "muirGlacier" | "berlin" | "london" | "arrowGlacier" | "grayGlacier" | "paris" | "shanghai" | "cancun" | "prague";
export interface ChainMetadata {
    /** Average block time in seconds */
    blockTime: number;
    /** Block gas limit */
    gasLimit: number;
    /** Whether this is a testnet */
    isTestnet: boolean;
    /** Whether this is an L2 */
    isL2: boolean;
    /** Parent L1 chain ID if this is an L2 */
    l1ChainId?: number;
    /** Latest active hardfork */
    latestHardfork: Hardfork;
    /** Hardfork activation blocks */
    hardforks: Partial<Record<Hardfork, number>>;
    /** WebSocket RPC URLs */
    websocketUrls?: string[];
}
/**
 * Metadata for popular chains
 */
export declare const CHAIN_METADATA: Record<number, ChainMetadata>;
/**
 * Default metadata for chains not in the registry
 */
export declare const DEFAULT_METADATA: ChainMetadata;
//# sourceMappingURL=metadata.d.ts.map