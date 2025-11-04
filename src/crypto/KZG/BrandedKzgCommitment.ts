/**
 * Branded type for KZG Commitment (EIP-4844)
 *
 * A KZG commitment is 48 bytes representing a BLS12-381 G1 point
 */
export type BrandedKzgCommitment = Uint8Array & {
	readonly __tag: "KzgCommitment";
};
