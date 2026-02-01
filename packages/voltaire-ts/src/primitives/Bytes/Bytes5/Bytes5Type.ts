import type { brand } from "../../../brand.js";

export type Bytes5Type = Uint8Array & {
	readonly [brand]: "Bytes5";
	readonly size: 5;
};
