import type { brand } from "../../../brand.js";

export type Bytes8Type = Uint8Array & {
	readonly [brand]: "Bytes8";
	readonly size: 8;
};
