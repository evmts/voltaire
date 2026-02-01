import type { brand } from "../../brand.js";

/**
 * Bytes32 - Fixed-size 32-byte array type
 *
 * Generic 32-byte data structure used throughout Ethereum for various purposes
 * including storage values, contract data, and numeric representations.
 * While Hash is specifically for cryptographic hashes, Bytes32 is the general-purpose
 * 32-byte type that can represent any 32-byte data.
 */
export type Bytes32Type = Uint8Array & {
	readonly [brand]: "Bytes32";
};

/**
 * Inputs that can be converted to Bytes32
 */
export type Bytes32Like = Bytes32Type | string | Uint8Array | bigint | number;
