/**
 * Solidity compiler metadata
 *
 * Encoded in CBOR format at the end of contract bytecode.
 * Contains compiler version and source verification hashes.
 */
export type Metadata = {
    /** Raw CBOR-encoded bytes */
    readonly raw: Uint8Array;
    /** Solidity compiler version (e.g., "0.8.19") */
    readonly solc?: string;
    /** IPFS content hash */
    readonly ipfs?: string;
    /** Swarm hash (legacy) */
    readonly bzzr0?: string;
    /** Swarm hash v1 */
    readonly bzzr1?: string;
    /** Experimental features enabled */
    readonly experimental?: boolean;
};
//# sourceMappingURL=MetadataType.d.ts.map