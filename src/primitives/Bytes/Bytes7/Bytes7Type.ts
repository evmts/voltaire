import type { brand } from "../../../brand.js";

export type Bytes7Type = Uint8Array & {
	readonly [brand]: "Bytes7";
	readonly size: 7;
};
