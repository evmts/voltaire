/**
 * ERC-165 Standard Interface Detection
 * Ethereum Improvement Proposal 165 (EIP-165)
 *
 * Standard method for detecting which interfaces a smart contract implements.
 */
/**
 * ERC-165 function selector
 */
export declare const SELECTOR = "0x01ffc9a7";
/**
 * Known interface IDs (XOR of all function selectors in the interface)
 */
export declare const INTERFACE_IDS: {
    /** ERC-165 itself */
    readonly ERC165: "0x01ffc9a7";
    /** ERC-20 Token Standard */
    readonly ERC20: "0x36372b07";
    /** ERC-721 Non-Fungible Token */
    readonly ERC721: "0x80ac58cd";
    /** ERC-721 Metadata Extension */
    readonly ERC721Metadata: "0x5b5e139f";
    /** ERC-721 Enumerable Extension */
    readonly ERC721Enumerable: "0x780e9d63";
    /** ERC-1155 Multi Token Standard */
    readonly ERC1155: "0xd9b67a26";
    /** ERC-1155 Metadata URI Extension */
    readonly ERC1155MetadataURI: "0x0e89341c";
    /** ERC-2981 NFT Royalty Standard */
    readonly ERC2981: "0x2a55205a";
    /** ERC-4906 Metadata Update Extension */
    readonly ERC4906: "0x49064906";
};
/**
 * Encode supportsInterface(bytes4) calldata
 */
export declare function encodeSupportsInterface(interfaceId: string): string;
/**
 * Decode supportsInterface return value
 */
export declare function decodeSupportsInterface(data: string): boolean;
/**
 * Check if contract supports an interface
 * @param provider - Ethereum provider (must support eth_call)
 * @param contract - Contract address
 * @param interfaceId - Interface ID to check (e.g., INTERFACE_IDS.ERC721)
 */
export declare function supportsInterface(provider: {
    request(args: {
        method: string;
        params: unknown[];
    }): Promise<string>;
}, contract: string, interfaceId: string): Promise<boolean>;
/**
 * Detect which standard interfaces a contract supports
 */
export declare function detectInterfaces(provider: {
    request(args: {
        method: string;
        params: unknown[];
    }): Promise<string>;
}, contract: string): Promise<string[]>;
//# sourceMappingURL=ERC165.d.ts.map