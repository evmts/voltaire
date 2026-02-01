import type { brand } from "../../../brand.js";

export type Bytes6Type = Uint8Array & {
	readonly [brand]: "Bytes6";
	readonly size: 6;
};
