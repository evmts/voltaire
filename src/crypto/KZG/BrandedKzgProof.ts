import type { brand } from "../../brand.js";

/**
 * Branded type for KZG Proof (EIP-4844)
 *
 * A KZG proof is 48 bytes representing a BLS12-381 G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export type BrandedKzgProof = Uint8Array & {
	readonly [brand]: "KzgProof";
};
