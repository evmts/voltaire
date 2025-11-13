import type { brand } from "../../../brand.js";

export type BrandedBytes32 = Uint8Array & {
	readonly [brand]: "Bytes32";
	readonly size: 32;
};

/**
 * Inputs that can be converted to Bytes32
 */
export type Bytes32Like =
	| BrandedBytes32
	| string
	| Uint8Array
	| bigint
	| number;

export const SIZE = 32;
