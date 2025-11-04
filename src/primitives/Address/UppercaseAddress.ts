import type * as Hex from "../Hex/index.js";
import type { BrandedAddress } from "./BrandedAddress.js";

/**
 * Uppercase address hex string
 */
export type Uppercase = Hex.Sized<20> & {
	readonly __tag: "Hex";
	readonly __variant: "Address";
	readonly __uppercase: true;
};

export declare function from(addr: BrandedAddress): Uppercase;
