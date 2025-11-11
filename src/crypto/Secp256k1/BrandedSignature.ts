/**
 * ECDSA signature with Ethereum-compatible v value
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes)
 * - s: signature proof value (32 bytes)
 * - v: recovery id (27 or 28 for Ethereum)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const signature: BrandedSignature = {
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32),
 *   v: 27
 * };
 * ```
 */
export interface BrandedSignature {
	r: Uint8Array;
	s: Uint8Array;
	v: number;
}
