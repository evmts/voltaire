import type { brand } from "../../../brand.js";

export type BrandedBytes3 = Uint8Array & {
	readonly [brand]: "Bytes3";
	readonly size: 3;
};
