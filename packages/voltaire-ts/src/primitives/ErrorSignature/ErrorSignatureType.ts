import type { brand } from "../../brand.js";

export type ErrorSignatureType = Uint8Array & {
	readonly [brand]: "ErrorSignature";
	readonly length: 4;
};

export type ErrorSignatureLike = ErrorSignatureType | string | Uint8Array;

export const SIZE = 4;
