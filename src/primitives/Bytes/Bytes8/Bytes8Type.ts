import type { brand } from "../../../brand.js";

export type BrandedBytes8 = Uint8Array & {
	readonly [brand]: "Bytes8";
	readonly size: 8;
};
