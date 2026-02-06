import type { brand } from "../../../brand.js";

export type Bytes16Type = Uint8Array & {
	readonly [brand]: "Bytes16";
	readonly size: 16;
};

/**
 * Inputs that can be converted to Bytes16
 */
export type Bytes16Like = Bytes16Type | string | Uint8Array;

export const SIZE = 16;
