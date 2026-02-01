/**
 * ERC-165 Standard Interface Detection
 * Ethereum Improvement Proposal 165 (EIP-165)
 *
 * Standard method for detecting which interfaces a smart contract implements.
 */
/**
 * ERC-165 function selector
 */
export const SELECTOR = "0x01ffc9a7"; // supportsInterface(bytes4)
/**
 * Known interface IDs (XOR of all function selectors in the interface)
 */
export const INTERFACE_IDS = {
    /** ERC-165 itself */
    ERC165: "0x01ffc9a7",
    /** ERC-20 Token Standard */
    ERC20: "0x36372b07",
    /** ERC-721 Non-Fungible Token */
    ERC721: "0x80ac58cd",
    /** ERC-721 Metadata Extension */
    ERC721Metadata: "0x5b5e139f",
    /** ERC-721 Enumerable Extension */
    ERC721Enumerable: "0x780e9d63",
    /** ERC-1155 Multi Token Standard */
    ERC1155: "0xd9b67a26",
    /** ERC-1155 Metadata URI Extension */
    ERC1155MetadataURI: "0x0e89341c",
    /** ERC-2981 NFT Royalty Standard */
    ERC2981: "0x2a55205a",
    /** ERC-4906 Metadata Update Extension */
    ERC4906: "0x49064906",
};
/**
 * Encode supportsInterface(bytes4) calldata
 */
export function encodeSupportsInterface(interfaceId) {
    // Remove 0x prefix if present
    const id = interfaceId.startsWith("0x") ? interfaceId.slice(2) : interfaceId;
    // Pad to 32 bytes (64 hex chars)
    const paddedId = id.padStart(64, "0");
    return `${SELECTOR}${paddedId}`;
}
/**
 * Decode supportsInterface return value
 */
export function decodeSupportsInterface(data) {
    return BigInt(data) !== 0n;
}
/**
 * Check if contract supports an interface
 * @param provider - Ethereum provider (must support eth_call)
 * @param contract - Contract address
 * @param interfaceId - Interface ID to check (e.g., INTERFACE_IDS.ERC721)
 */
export async function supportsInterface(provider, contract, interfaceId) {
    const data = encodeSupportsInterface(interfaceId);
    try {
        const result = await provider.request({
            method: "eth_call",
            params: [{ to: contract, data }, "latest"],
        });
        // Handle empty response (contract doesn't implement ERC-165)
        if (!result || result === "0x") {
            return false;
        }
        return decodeSupportsInterface(result);
    }
    catch (_error) {
        // Contract doesn't support ERC-165 or call failed
        return false;
    }
}
/**
 * Detect which standard interfaces a contract supports
 */
export async function detectInterfaces(provider, contract) {
    const supported = [];
    // Check ERC-165 first
    const supportsERC165 = await supportsInterface(provider, contract, INTERFACE_IDS.ERC165);
    if (!supportsERC165) {
        return supported; // Contract doesn't implement ERC-165
    }
    supported.push("ERC165");
    // Check all known interfaces in parallel
    const checks = Object.entries(INTERFACE_IDS)
        .filter(([name]) => name !== "ERC165") // Already checked
        .map(async ([name, id]) => {
        const supports = await supportsInterface(provider, contract, id);
        return supports ? name : null;
    });
    const results = await Promise.all(checks);
    supported.push(...results.filter((name) => name !== null));
    return supported;
}
