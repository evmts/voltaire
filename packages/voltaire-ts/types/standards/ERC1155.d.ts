import type { AddressType } from "../primitives/Address/AddressType.js";
import type { Uint256Type } from "../primitives/Uint/Uint256Type.js";
/**
 * ERC-1155 Multi Token Standard
 * Ethereum Improvement Proposal 1155 (EIP-1155)
 *
 * Standard interface for multi-token contracts supporting both fungible and non-fungible tokens.
 */
/**
 * ERC-1155 function selectors
 * First 4 bytes of keccak256 hash of function signature
 */
export declare const SELECTORS: {
    /** balanceOf(address,uint256) */
    readonly balanceOf: "0x00fdd58e";
    /** balanceOfBatch(address[],uint256[]) */
    readonly balanceOfBatch: "0x4e1273f4";
    /** setApprovalForAll(address,bool) */
    readonly setApprovalForAll: "0xa22cb465";
    /** isApprovedForAll(address,address) */
    readonly isApprovedForAll: "0xe985e9c5";
    /** safeTransferFrom(address,address,uint256,uint256,bytes) */
    readonly safeTransferFrom: "0xf242432a";
    /** safeBatchTransferFrom(address,address,uint256[],uint256[],bytes) */
    readonly safeBatchTransferFrom: "0x2eb2c2d6";
    /** uri(uint256) */
    readonly uri: "0x0e89341c";
};
/**
 * ERC-1155 event signatures
 * keccak256 hash of event signature
 */
export declare const EVENTS: {
    /** TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value) */
    readonly TransferSingle: "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
    /** TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values) */
    readonly TransferBatch: "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";
    /** ApprovalForAll(address indexed account, address indexed operator, bool approved) */
    readonly ApprovalForAll: "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";
    /** URI(string value, uint256 indexed id) */
    readonly URI: "0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b";
};
/**
 * Encode balanceOf(address,uint256) calldata
 */
export declare function encodeBalanceOf(account: AddressType, id: Uint256Type): string;
/**
 * Encode setApprovalForAll(address,bool) calldata
 */
export declare function encodeSetApprovalForAll(operator: AddressType, approved: boolean): string;
/**
 * Encode safeTransferFrom(address,address,uint256,uint256,bytes) calldata
 */
export declare function encodeSafeTransferFrom(from: AddressType, to: AddressType, id: Uint256Type, amount: Uint256Type, data?: Uint8Array): string;
/**
 * Encode isApprovedForAll(address,address) calldata
 */
export declare function encodeIsApprovedForAll(account: AddressType, operator: AddressType): string;
/**
 * Encode uri(uint256) calldata
 */
export declare function encodeURI(id: Uint256Type): string;
/**
 * Decode TransferSingle event log
 */
export declare function decodeTransferSingleEvent(log: {
    topics: string[];
    data: string;
}): {
    operator: string;
    from: string;
    to: string;
    id: Uint256Type;
    value: Uint256Type;
};
/**
 * Decode ApprovalForAll event log
 */
export declare function decodeApprovalForAllEvent(log: {
    topics: string[];
    data: string;
}): {
    account: string;
    operator: string;
    approved: boolean;
};
//# sourceMappingURL=ERC1155.d.ts.map