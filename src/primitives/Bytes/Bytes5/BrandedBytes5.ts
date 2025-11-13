import type { brand } from "../../../brand.js";

export type BrandedBytes5 = Uint8Array & {
	readonly [brand]: "Bytes5";
	readonly size: 5;
};
