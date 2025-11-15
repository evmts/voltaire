import type { brand } from "../../../brand.js";

export type BrandedBytes4 = Uint8Array & {
	readonly [brand]: "Bytes4";
	readonly size: 4;
};
