import type { brand } from "../../../brand.js";

export type Bytes2Type = Uint8Array & {
	readonly [brand]: "Bytes2";
	readonly size: 2;
};
