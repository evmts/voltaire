import type * as Hex from "../Hex/index.js";
import type { BrandedAddress } from "./BrandedAddress.js";

/**
 * EIP-55 checksummed address
 */
export type Checksummed = Hex.Sized<20> & {
	readonly __tag: "Hex";
	readonly __variant: "Address";
	readonly __checksummed: true;
};

export declare function from(addr: BrandedAddress): Checksummed;
export declare function isValid(str: string): boolean;
