/**
 * Branded type for KZG Proof (EIP-4844)
 *
 * A KZG proof is 48 bytes representing a BLS12-381 G1 point
 */
export type BrandedKzgProof = Uint8Array & {
	readonly __tag: "KzgProof";
};
