import type { brand } from "../../../brand.js";

export type BrandedBytes = Uint8Array & {
	readonly [brand]: "Bytes";
};
