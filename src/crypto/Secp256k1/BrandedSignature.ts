/**
 * ECDSA signature with Ethereum-compatible v value
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes, BrandedHash)
 * - s: signature proof value (32 bytes, BrandedHash)
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
export interface BrandedSignature {
	r: import("../../primitives/Hash/index.js").BrandedHash;
	s: import("../../primitives/Hash/index.js").BrandedHash;
	v: number;
}
