import type { brand } from "../../../brand.js";

/**
 * Branded PrivateKey type - 32 byte private key for cryptographic operations
 * Prevents accidental exposure or misuse of sensitive key material
 */
export type BrandedPrivateKey = Uint8Array & {
	readonly [brand]: "PrivateKey";
	readonly length: 32;
};
