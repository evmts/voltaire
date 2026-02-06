import type { AddressType } from "../primitives/Address/AddressType.js";
import type { Uint256Type } from "../primitives/Uint/Uint256Type.js";
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
export declare const SELECTORS: {
    /** balanceOf(address) */
    readonly balanceOf: "0x70a08231";
    /** ownerOf(uint256) */
    readonly ownerOf: "0x6352211e";
    /** safeTransferFrom(address,address,uint256) */
    readonly safeTransferFrom: "0x42842e0e";
    /** safeTransferFrom(address,address,uint256,bytes) */
    readonly safeTransferFromWithData: "0xb88d4fde";
    /** transferFrom(address,address,uint256) */
    readonly transferFrom: "0x23b872dd";
    /** approve(address,uint256) */
    readonly approve: "0x095ea7b3";
    /** setApprovalForAll(address,bool) */
    readonly setApprovalForAll: "0xa22cb465";
    /** getApproved(uint256) */
    readonly getApproved: "0x081812fc";
    /** isApprovedForAll(address,address) */
    readonly isApprovedForAll: "0xe985e9c5";
    /** name() */
    readonly name: "0x06fdde03";
    /** symbol() */
    readonly symbol: "0x95d89b41";
    /** tokenURI(uint256) */
    readonly tokenURI: "0xc87b56dd";
    /** totalSupply() */
    readonly totalSupply: "0x18160ddd";
    /** tokenOfOwnerByIndex(address,uint256) */
    readonly tokenOfOwnerByIndex: "0x2f745c59";
    /** tokenByIndex(uint256) */
    readonly tokenByIndex: "0x4f6ccce7";
};
/**
 * ERC-721 event signatures
 * keccak256 hash of event signature
 */
export declare const EVENTS: {
    /** Transfer(address indexed from, address indexed to, uint256 indexed tokenId) */
    readonly Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    /** Approval(address indexed owner, address indexed approved, uint256 indexed tokenId) */
    readonly Approval: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
    /** ApprovalForAll(address indexed owner, address indexed operator, bool approved) */
    readonly ApprovalForAll: "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";
};
/**
 * Encode transferFrom(address,address,uint256) calldata
 */
export declare function encodeTransferFrom(from: AddressType, to: AddressType, tokenId: Uint256Type): string;
/**
 * Encode safeTransferFrom(address,address,uint256) calldata
 */
export declare function encodeSafeTransferFrom(from: AddressType, to: AddressType, tokenId: Uint256Type): string;
/**
 * Encode approve(address,uint256) calldata
 */
export declare function encodeApprove(to: AddressType, tokenId: Uint256Type): string;
/**
 * Encode setApprovalForAll(address,bool) calldata
 */
export declare function encodeSetApprovalForAll(operator: AddressType, approved: boolean): string;
/**
 * Encode ownerOf(uint256) calldata
 */
export declare function encodeOwnerOf(tokenId: Uint256Type): string;
/**
 * Encode tokenURI(uint256) calldata
 */
export declare function encodeTokenURI(tokenId: Uint256Type): string;
/**
 * Decode Transfer event log
 */
export declare function decodeTransferEvent(log: {
    topics: string[];
    data: string;
}): {
    from: string;
    to: string;
    tokenId: Uint256Type;
};
/**
 * Decode Approval event log
 */
export declare function decodeApprovalEvent(log: {
    topics: string[];
    data: string;
}): {
    owner: string;
    approved: string;
    tokenId: Uint256Type;
};
/**
 * Decode ApprovalForAll event log
 */
export declare function decodeApprovalForAllEvent(log: {
    topics: string[];
    data: string;
}): {
    owner: string;
    operator: string;
    approved: boolean;
};
//# sourceMappingURL=ERC721.d.ts.map