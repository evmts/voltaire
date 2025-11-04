import type { BrandedAddress } from "../../Address/index.js";

/**
 * Branded Authorization type for EIP-7702
 */
export type BrandedAuthorization = {
	readonly __tag: "Authorization";
	chainId: bigint;
	address: BrandedAddress;
	nonce: bigint;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
};
