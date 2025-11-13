import type { brand } from "../../../brand.js";

export type BrandedBytes2 = Uint8Array & {
	readonly [brand]: "Bytes2";
	readonly size: 2;
};
