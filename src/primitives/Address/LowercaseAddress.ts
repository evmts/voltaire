import type * as Hex from "../Hex/index.js";

/**
 * Lowercase address hex string
 */
export type Lowercase = Hex.Sized<20> & {
	readonly __tag: "Hex";
	readonly __variant: "Address";
	readonly __lowercase: true;
};

export type { from } from "./LowercaseAddress.js";
