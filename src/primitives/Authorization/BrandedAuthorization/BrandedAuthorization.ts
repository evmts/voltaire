import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";

/**
 * EIP-7702 Authorization branded type
 * Allows EOA to delegate code execution to another address
 */
export type BrandedAuthorization = {
	/** Chain ID where authorization is valid */
	chainId: bigint;
	/** Address to delegate code execution to */
	address: BrandedAddress;
	/** Nonce of the authorizing account */
	nonce: bigint;
	/** Signature Y parity (0 or 1) */
	yParity: number;
	/** Signature r value */
	r: bigint;
	/** Signature s value */
	s: bigint;
};
