/**
 * Branded type for Blob (EIP-4844)
 *
 * A blob is 131072 bytes (128 KB) containing 4096 field elements
 */
export type BrandedBlob = Uint8Array & {
	readonly __tag: "Blob";
};
