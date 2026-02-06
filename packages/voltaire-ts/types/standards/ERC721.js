/**
 * ERC-721 Non-Fungible Token Standard
 * Ethereum Improvement Proposal 721 (EIP-721)
 *
 * Standard interface for non-fungible tokens (NFTs) on Ethereum.
 */
/**
 * ERC-721 function selectors
 * First 4 bytes of keccak256 hash of function signature
 */
export const SELECTORS = {
    /** balanceOf(address) */
    balanceOf: "0x70a08231",
    /** ownerOf(uint256) */
    ownerOf: "0x6352211e",
    /** safeTransferFrom(address,address,uint256) */
    safeTransferFrom: "0x42842e0e",
    /** safeTransferFrom(address,address,uint256,bytes) */
    safeTransferFromWithData: "0xb88d4fde",
    /** transferFrom(address,address,uint256) */
    transferFrom: "0x23b872dd",
    /** approve(address,uint256) */
    approve: "0x095ea7b3",
    /** setApprovalForAll(address,bool) */
    setApprovalForAll: "0xa22cb465",
    /** getApproved(uint256) */
    getApproved: "0x081812fc",
    /** isApprovedForAll(address,address) */
    isApprovedForAll: "0xe985e9c5",
    // ERC-721 Metadata extension
    /** name() */
    name: "0x06fdde03",
    /** symbol() */
    symbol: "0x95d89b41",
    /** tokenURI(uint256) */
    tokenURI: "0xc87b56dd",
    // ERC-721 Enumerable extension
    /** totalSupply() */
    totalSupply: "0x18160ddd",
    /** tokenOfOwnerByIndex(address,uint256) */
    tokenOfOwnerByIndex: "0x2f745c59",
    /** tokenByIndex(uint256) */
    tokenByIndex: "0x4f6ccce7",
};
/**
 * ERC-721 event signatures
 * keccak256 hash of event signature
 */
export const EVENTS = {
    /** Transfer(address indexed from, address indexed to, uint256 indexed tokenId) */
    Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    /** Approval(address indexed owner, address indexed approved, uint256 indexed tokenId) */
    Approval: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    /** ApprovalForAll(address indexed owner, address indexed operator, bool approved) */
    ApprovalForAll: "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
};
/**
 * Encode transferFrom(address,address,uint256) calldata
 */
export function encodeTransferFrom(from, to, tokenId) {
    // Convert addresses (20 bytes each) to hex and pad to 32 bytes
    const fromHex = Array.from(from, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padStart(64, "0");
    const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padStart(64, "0");
    const tokenIdHex = tokenId.toString(16).padStart(64, "0");
    return `${SELECTORS.transferFrom}${fromHex}${toHex}${tokenIdHex}`;
}
/**
 * Encode safeTransferFrom(address,address,uint256) calldata
 */
export function encodeSafeTransferFrom(from, to, tokenId) {
    // Convert addresses (20 bytes each) to hex and pad to 32 bytes
    const fromHex = Array.from(from, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padStart(64, "0");
    const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padStart(64, "0");
    const tokenIdHex = tokenId.toString(16).padStart(64, "0");
    return `${SELECTORS.safeTransferFrom}${fromHex}${toHex}${tokenIdHex}`;
}
/**
 * Encode approve(address,uint256) calldata
 */
export function encodeApprove(to, tokenId) {
    // Convert address (20 bytes) to hex and pad to 32 bytes
    const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padStart(64, "0");
    const tokenIdHex = tokenId.toString(16).padStart(64, "0");
    return `${SELECTORS.approve}${toHex}${tokenIdHex}`;
}
/**
 * Encode setApprovalForAll(address,bool) calldata
 */
export function encodeSetApprovalForAll(operator, approved) {
    // Convert address (20 bytes) to hex and pad to 32 bytes
    const operatorHex = Array.from(operator, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .padStart(64, "0");
    const approvedHex = approved ? "1".padStart(64, "0") : "0".padStart(64, "0");
    return `${SELECTORS.setApprovalForAll}${operatorHex}${approvedHex}`;
}
/**
 * Encode ownerOf(uint256) calldata
 */
export function encodeOwnerOf(tokenId) {
    const tokenIdHex = tokenId.toString(16).padStart(64, "0");
    return `${SELECTORS.ownerOf}${tokenIdHex}`;
}
/**
 * Encode tokenURI(uint256) calldata
 */
export function encodeTokenURI(tokenId) {
    const tokenIdHex = tokenId.toString(16).padStart(64, "0");
    return `${SELECTORS.tokenURI}${tokenIdHex}`;
}
/**
 * Decode Transfer event log
 */
export function decodeTransferEvent(log) {
    if (log.topics[0] !== EVENTS.Transfer) {
        throw new Error("Not a Transfer event");
    }
    // Topics: [event_sig, from, to, tokenId]
    const fromTopic = log.topics[1];
    const toTopic = log.topics[2];
    const tokenIdTopic = log.topics[3];
    if (!fromTopic || !toTopic || !tokenIdTopic) {
        throw new Error("Missing Transfer event topics");
    }
    const from = `0x${fromTopic.slice(26)}`; // Remove padding
    const to = `0x${toTopic.slice(26)}`; // Remove padding
    const tokenId = BigInt(tokenIdTopic);
    return { from, to, tokenId };
}
/**
 * Decode Approval event log
 */
export function decodeApprovalEvent(log) {
    if (log.topics[0] !== EVENTS.Approval) {
        throw new Error("Not an Approval event");
    }
    // Topics: [event_sig, owner, approved, tokenId]
    const ownerTopic = log.topics[1];
    const approvedTopic = log.topics[2];
    const tokenIdTopic = log.topics[3];
    if (!ownerTopic || !approvedTopic || !tokenIdTopic) {
        throw new Error("Missing Approval event topics");
    }
    const owner = `0x${ownerTopic.slice(26)}`; // Remove padding
    const approved = `0x${approvedTopic.slice(26)}`; // Remove padding
    const tokenId = BigInt(tokenIdTopic);
    return { owner, approved, tokenId };
}
/**
 * Decode ApprovalForAll event log
 */
export function decodeApprovalForAllEvent(log) {
    if (log.topics[0] !== EVENTS.ApprovalForAll) {
        throw new Error("Not an ApprovalForAll event");
    }
    // Topics: [event_sig, owner, operator]
    const ownerTopic = log.topics[1];
    const operatorTopic = log.topics[2];
    if (!ownerTopic || !operatorTopic) {
        throw new Error("Missing ApprovalForAll event topics");
    }
    const owner = `0x${ownerTopic.slice(26)}`; // Remove padding
    const operator = `0x${operatorTopic.slice(26)}`; // Remove padding
    const approved = BigInt(log.data) !== 0n;
    return { owner, operator, approved };
}
