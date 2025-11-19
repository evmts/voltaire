import type { brand } from "../../brand.js";

/**
 * EIP-712 Domain Separator - keccak256 hash of domain separator
 * Used in EIP-712 signature verification for domain separation
 */
export type DomainSeparatorType = Uint8Array & {
	readonly [brand]: "DomainSeparator";
	readonly length: 32;
};

export const SIZE = 32;
