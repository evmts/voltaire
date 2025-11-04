/**
 * Branded Blob types for EIP-4844
 */

/**
 * Blob data (exactly 131072 bytes)
 */
export type BrandedBlob = Uint8Array & { readonly __blob: unique symbol };

/**
 * KZG commitment (48 bytes)
 */
export type Commitment = Uint8Array & { readonly __commitment: unique symbol };

/**
 * KZG proof (48 bytes)
 */
export type Proof = Uint8Array & { readonly __proof: unique symbol };

/**
 * Versioned hash (32 bytes) - commitment hash with version prefix
 */
export type VersionedHash = Uint8Array & {
	readonly __versionedHash: unique symbol;
};
