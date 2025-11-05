import type * as Hex from "../../Hex/index.js";
import type { BrandedAddress } from "./BrandedAddress.js";

/**
 * Lowercase address hex string
 */
export type Lowercase = Hex.Sized<20> & {
	readonly __tag: "Hex";
	readonly __variant: "Address";
	readonly __lowercase: true;
};

export declare function from(addr: BrandedAddress): Lowercase;
