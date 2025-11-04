import type * as Hex from "../Hex/index.js";

/**
 * EIP-55 checksummed address
 */
export type Checksummed = Hex.Sized<20> & {
	readonly __tag: "Hex";
	readonly __variant: "Address";
	readonly __checksummed: true;
};

export type { from, isValid } from "./ChecksumAddress.js";
