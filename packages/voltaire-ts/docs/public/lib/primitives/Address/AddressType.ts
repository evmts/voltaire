import type { brand } from "../../brand.js";

export type AddressType = Uint8Array & {
	readonly [brand]: "Address";
};
