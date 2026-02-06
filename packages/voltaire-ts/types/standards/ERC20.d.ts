import type { AddressType } from "../primitives/Address/AddressType.js";
import type { Uint256Type } from "../primitives/Uint/Uint256Type.js";
/**
 * ERC-20 Token Standard
 * Ethereum Improvement Proposal 20 (EIP-20)
 *
 * Standard interface for fungible tokens on Ethereum.
 */
/**
 * ERC-20 function selectors
 * First 4 bytes of keccak256 hash of function signature
 */
export declare const SELECTORS: {
    /** totalSupply() */
    readonly totalSupply: "0x18160ddd";
    /** balanceOf(address) */
    readonly balanceOf: "0x70a08231";
    /** transfer(address,uint256) */
    readonly transfer: "0xa9059cbb";
    /** transferFrom(address,address,uint256) */
    readonly transferFrom: "0x23b872dd";
    /** approve(address,uint256) */
    readonly approve: "0x095ea7b3";
    /** allowance(address,address) */
    readonly allowance: "0xdd62ed3e";
    /** name() */
    readonly name: "0x06fdde03";
    /** symbol() */
    readonly symbol: "0x95d89b41";
    /** decimals() */
    readonly decimals: "0x313ce567";
    /** permit(address,address,uint256,uint256,uint8,bytes32,bytes32) */
    readonly permit: "0xd505accf";
    /** nonces(address) */
    readonly nonces: "0x7ecebe00";
    /** DOMAIN_SEPARATOR() */
    readonly DOMAIN_SEPARATOR: "0x3644e515";
};
/**
 * ERC-20 event signatures
 * keccak256 hash of event signature
 */
export declare const EVENTS: {
    /** Transfer(address indexed from, address indexed to, uint256 value) */
    readonly Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    /** Approval(address indexed owner, address indexed spender, uint256 value) */
    readonly Approval: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
};
/**
 * Encode transfer(address,uint256) calldata
 */
export declare function encodeTransfer(to: AddressType, amount: Uint256Type): string;
/**
 * Encode approve(address,uint256) calldata
 */
export declare function encodeApprove(spender: AddressType, amount: Uint256Type): string;
/**
 * Encode transferFrom(address,address,uint256) calldata
 */
export declare function encodeTransferFrom(from: AddressType, to: AddressType, amount: Uint256Type): string;
/**
 * Encode balanceOf(address) calldata
 */
export declare function encodeBalanceOf(account: AddressType): string;
/**
 * Encode allowance(address,address) calldata
 */
export declare function encodeAllowance(owner: AddressType, spender: AddressType): string;
/**
 * Encode name() calldata
 */
export declare function encodeName(): string;
/**
 * Encode symbol() calldata
 */
export declare function encodeSymbol(): string;
/**
 * Encode decimals() calldata
 */
export declare function encodeDecimals(): string;
/**
 * Encode totalSupply() calldata
 */
export declare function encodeTotalSupply(): string;
/**
 * Decode decimals return value (uint8)
 */
export declare function decodeDecimals(data: string): number;
/**
 * Decode Transfer event log
 */
export declare function decodeTransferEvent(log: {
    topics: string[];
    data: string;
}): {
    from: string;
    to: string;
    value: Uint256Type;
};
/**
 * Decode Approval event log
 */
export declare function decodeApprovalEvent(log: {
    topics: string[];
    data: string;
}): {
    owner: string;
    spender: string;
    value: Uint256Type;
};
/**
 * Decode uint256 return value
 */
export declare function decodeUint256(data: string): Uint256Type;
/**
 * Decode address return value
 */
export declare function decodeAddress(data: string): string;
/**
 * Decode bool return value
 */
export declare function decodeBool(data: string): boolean;
/**
 * Decode string return value
 */
export declare function decodeString(data: string): string;
/**
 * Decode totalSupply() return value (uint256)
 */
export declare function decodeTotalSupplyResult(data: string): Uint256Type;
/**
 * Decode name() return value (string)
 */
export declare function decodeNameResult(data: string): string;
/**
 * Decode symbol() return value (string)
 */
export declare function decodeSymbolResult(data: string): string;
/**
 * Decode decimals() return value (uint8)
 */
export declare function decodeDecimalsResult(data: string): number;
//# sourceMappingURL=ERC20.d.ts.map