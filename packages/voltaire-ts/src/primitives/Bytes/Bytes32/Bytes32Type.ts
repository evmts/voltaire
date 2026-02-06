import type { brand } from "../../../brand.js";

export type Bytes32Type = Uint8Array & {
	readonly [brand]: "Bytes32";
	readonly size: 32;
};

/**
 * Inputs that can be converted to Bytes32
 */
export type Bytes32Like = Bytes32Type | string | Uint8Array | bigint | number;

export const SIZE = 32;
