import type { brand } from "../../../brand.js";

export type Bytes64Type = Uint8Array & {
	readonly [brand]: "Bytes64";
	readonly size: 64;
};

/**
 * Inputs that can be converted to Bytes64
 */
export type Bytes64Like = Bytes64Type | string | Uint8Array;

export const SIZE = 64;
