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
	readonly fields: Uint8Array; // bytes1 bitmap
	readonly name: string;
	readonly version: string;
	readonly chainId: bigint; // uint256 in ERC-5267
	readonly verifyingContract: AddressType;
	readonly salt: Uint8Array; // bytes32
	readonly extensions: readonly bigint[]; // uint256[]
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
export const ERC5267_FIELDS = {
	NAME: 0x01,
	VERSION: 0x02,
	CHAIN_ID: 0x04,
	VERIFYING_CONTRACT: 0x08,
	SALT: 0x10,
	EXTENSIONS: 0x20,
} as const;
