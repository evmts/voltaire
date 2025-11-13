import type { brand } from "../../../brand.js";

export type BrandedBytes6 = Uint8Array & {
	readonly [brand]: "Bytes6";
	readonly size: 6;
};
