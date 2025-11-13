import type { brand } from "../../../brand.js";

export type BrandedBytes7 = Uint8Array & {
	readonly [brand]: "Bytes7";
	readonly size: 7;
};
