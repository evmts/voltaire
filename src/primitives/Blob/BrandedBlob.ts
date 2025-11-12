import type { brand } from "../../brand.js";

/**
 * Branded Blob types for EIP-4844
 */

/**
 * Blob data (exactly 131072 bytes)
 */
export type BrandedBlob = Uint8Array & { readonly [brand]: "Blob" };

/**
 * KZG commitment (48 bytes)
 */
export type Commitment = Uint8Array & { readonly [brand]: "Commitment" };

/**
 * KZG proof (48 bytes)
 */
export type Proof = Uint8Array & { readonly [brand]: "Proof" };

/**
 * Versioned hash (32 bytes) - commitment hash with version prefix
 */
export type VersionedHash = Uint8Array & {
	readonly [brand]: "VersionedHash";
};
