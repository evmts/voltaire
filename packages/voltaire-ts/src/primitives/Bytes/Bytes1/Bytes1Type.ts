import type { brand } from "../../../brand.js";

export type Bytes1Type = Uint8Array & {
	readonly [brand]: "Bytes1";
	readonly size: 1;
};
