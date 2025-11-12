import type { brand } from "../../../brand.js";

export type BrandedAddress = Uint8Array & {
	readonly [brand]: "Address";
};
