/**
 * ECDSA signature with Ethereum-compatible v value
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes, HashType)
 * - s: signature proof value (32 bytes, HashType)
 * - v: recovery id (27 or 28 for Ethereum)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const signature: BrandedSignature = {
 *   r: Hash.from(new Uint8Array(32)),
 *   s: Hash.from(new Uint8Array(32)),
 *   v: 27
 * };
 * ```
 */
export interface Secp256k1SignatureType {
	r: import("../../primitives/Hash/index.js").HashType;
	s: import("../../primitives/Hash/index.js").HashType;
	v: number;
}

/**
 * @deprecated Use Secp256k1SignatureType instead
 */
export type BrandedSignature = Secp256k1SignatureType;
