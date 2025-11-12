import type { brand } from "../../brand.js";

/**
 * Branded type for KZG Commitment (EIP-4844)
 *
 * A KZG commitment is 48 bytes representing a BLS12-381 G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export type BrandedKzgCommitment = Uint8Array & {
	readonly [brand]: "KzgCommitment";
};
