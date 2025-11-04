import type * as Hex from "../Hex/index.js";

/**
 * Uppercase address hex string
 */
export type Uppercase = Hex.Sized<20> & {
	readonly __tag: "Hex";
	readonly __variant: "Address";
	readonly __uppercase: true;
};

export type { from } from "./UppercaseAddress.js";
