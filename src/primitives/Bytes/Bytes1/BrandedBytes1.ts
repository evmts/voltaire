import type { brand } from "../../../brand.js";

export type BrandedBytes1 = Uint8Array & {
	readonly [brand]: "Bytes1";
	readonly size: 1;
};
