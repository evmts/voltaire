import type { AddressType } from "../Address/AddressType.js";
/**
 * ERC-5267 eip712Domain() return type
 *
 * Standardized format for returning EIP-712 domain parameters
 * from smart contracts implementing ERC-5267.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5267
 */
export type ERC5267Response = {
    readonly fields: Uint8Array;
    readonly name: string;
    readonly version: string;
    readonly chainId: bigint;
    readonly verifyingContract: AddressType;
    readonly salt: Uint8Array;
    readonly extensions: readonly bigint[];
};
/**
 * Field bitmap positions (ERC-5267 spec)
 *
 * Each bit indicates presence of corresponding field:
 * - 0x01: name
 * - 0x02: version
 * - 0x04: chainId
 * - 0x08: verifyingContract
 * - 0x10: salt
 * - 0x20: extensions (reserved for future use)
 */
export declare const ERC5267_FIELDS: {
    readonly NAME: 1;
    readonly VERSION: 2;
    readonly CHAIN_ID: 4;
    readonly VERIFYING_CONTRACT: 8;
    readonly SALT: 16;
    readonly EXTENSIONS: 32;
};
//# sourceMappingURL=ERC5267Type.d.ts.map