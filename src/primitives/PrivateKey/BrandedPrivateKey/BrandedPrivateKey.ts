/**
 * Branded PrivateKey type - 32 byte private key for cryptographic operations
 * Prevents accidental exposure or misuse of sensitive key material
 */
export type BrandedPrivateKey = Uint8Array & {
	readonly __tag: "PrivateKey";
	readonly length: 32;
};
