/**
 * Branded PublicKey type - 64 byte uncompressed public key
 * Distinguishes from generic Hex/Uint8Array
 */
export type BrandedPublicKey = Uint8Array & {
	readonly __tag: "PublicKey";
	readonly length: 64;
};
