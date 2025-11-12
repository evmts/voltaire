import type { brand } from "../../../brand.js";

/**
 * Branded PublicKey type - 64 byte uncompressed public key
 * Distinguishes from generic Hex/Uint8Array
 */
export type BrandedPublicKey = Uint8Array & {
	readonly [brand]: "PublicKey";
	readonly length: 64;
};
