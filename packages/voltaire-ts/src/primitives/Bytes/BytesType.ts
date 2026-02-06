import type { brand } from "../../brand.js";

export type BytesType = Uint8Array & {
	readonly [brand]: "Bytes";
};
